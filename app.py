from flask import Flask, jsonify
from pyspark.sql import SparkSession
from pyspark.sql.window import Window
from pyspark.sql.functions import col, to_timestamp, hour, split, expr, count, sum, rank

# Initialize Spark session
def get_spark_session():
    return SparkSession.builder \
        .appName("GitHub Events Analysis") \
        .getOrCreate()

schema = """
    id STRING,
    type STRING,
    actor STRUCT<id: BIGINT, login: STRING, display_login: STRING, gravatar_id: STRING, url: STRING, avatar_url: STRING>,
    repo STRUCT<id: BIGINT, name: STRING, url: STRING>,
    payload STRUCT<repository_id: BIGINT, push_id: BIGINT, size: INT, distinct_size: INT, ref: STRING, head: STRING, before: STRING, commits: ARRAY<STRUCT<sha: STRING, author: STRUCT<email: STRING, name: STRING>, message: STRING, distinct: BOOLEAN, url: STRING>>>,
    public BOOLEAN,
    created_at STRING
"""

def process_data():
    spark = get_spark_session()
  
    path = "./2024-01-08-*.json.gz"  # Wildcard for hours 0-23

    # Read data from all files
    df = spark.read.schema(schema).json(path)
    # Create the summarized table
    summarized_df = df.select(
        col("type"),
        split(col("repo.name"), "/")[1].alias("project_name"),
        hour(to_timestamp("created_at")).alias("hour")
    )

    # Filter out 'Push' events with 'bot' in the author's email
    cleaned_df = summarized_df.filter(~(
        (col("type") == "PushEvent") &
        expr("exists(payload.commits, c -> c.author.email like '%bot@%')")
    ))
    return cleaned_df

app = Flask(__name__)

@app.route('/events_per_hour', methods=['GET'])
def get_events_per_hour():
    # Initialize SparkSession (if not already initialized)
    spark = get_spark_session()
    
    # Process data and calculate the total number of events for each hour
    cleaned_df = process_data()
    events_per_hour_df = cleaned_df.groupBy("hour").agg(count("*").alias("total_events")).orderBy("hour")

    # Collect the result and convert to a list of dictionaries for JSON response
    result = events_per_hour_df.collect()
    events_per_hour = [{"hour": row["hour"], "total_events": row["total_events"]} for row in result]

    # Return the result as a JSON response
    return jsonify(events_per_hour)

@app.route('/top_20_watch_events_hourly', methods=['GET'])
def top_20_watch_events_hourly():
    df = process_data()
    # Filter for WatchEvents and aggregate by project_name and hour, counting events
    watch_events_hourly = df.filter(col("type") == "WatchEvent").groupBy("project_name", "hour").agg(count("*").alias("hourly_watch_events"))
    
    # Aggregate total watch events per project to sort projects by this total
    total_watch_events_per_project = df.filter(col("type") == "WatchEvent").groupBy("project_name").agg(count("*").alias("total_watch_events"))
    
    # Join the hourly and total aggregates, then order by total watch events descending
    watch_events_with_total = watch_events_hourly.join(total_watch_events_per_project, "project_name").orderBy(col("total_watch_events").desc(), "project_name", "hour")
    
    # Collect data and prepare JSON response
    result = watch_events_with_total.collect()
    projects_watch_events = {}
    for row in result:
        if row["project_name"] not in projects_watch_events:
            projects_watch_events[row["project_name"]] = {"total_watch_events": row["total_watch_events"], "hourly_watch_events": {}}
        projects_watch_events[row["project_name"]]["hourly_watch_events"][row["hour"]] = row["hourly_watch_events"]
    
    # Convert to list and sort by total watch events
    projects_watch_events_list = [{"project_name": k, **v} for k, v in projects_watch_events.items()]
    projects_watch_events_list.sort(key=lambda x: x["total_watch_events"], reverse=True)
    
    # Limit to top 20 projects
    top_20_projects_watch_events = projects_watch_events_list[:20]
    
    return jsonify(top_20_projects_watch_events)

@app.route('/top_20_watch_events', methods=['GET'])
def top_20_watch_events():
    df = process_data()
    # Filter for WatchEvents and aggregate
    watch_events_df = df.filter(col("type") == "WatchEvent").groupBy("project_name").count().withColumnRenamed("count", "watch_events").orderBy(col("watch_events").desc()).limit(20)
    result = watch_events_df.collect()
    top_20_watch_events = [{"project_name": row["project_name"], "watch_events": row["watch_events"]} for row in result]
    return jsonify(top_20_watch_events)

@app.route('/top_10_events_by_hour', methods=['GET'])
def top10eventsbyhour():
    spark = get_spark_session()
    df = process_data()

    # Group by project_name and hour, then count the number of events per group
    events_per_project_hourly = df.groupBy("project_name", "hour").agg(count("*").alias("event_count"))

    # For each hour, find the top 10 projects by event count
    windowSpec = Window.partitionBy("hour").orderBy(col("event_count").desc())

    top10events_per_hour = events_per_project_hourly.withColumn("rank", rank().over(windowSpec)).filter(col("rank") <= 10).orderBy("hour", "rank")

    # Collect the result and convert to a structured format for JSON response
    result = top10events_per_hour.collect()
    events_by_hour = {}
    for row in result:
        hour = row["hour"]
        if hour not in events_by_hour:
            events_by_hour[hour] = []
        events_by_hour[hour].append({
            "project_name": row["project_name"],
            "event_count": row["event_count"]
        })

    # Convert to list sorted by hour for consistent ordering in the response
    sorted_events_by_hour = [{"hour": k, "projects": v} for k, v in sorted(events_by_hour.items(), key=lambda item: item[0])]

    return jsonify(sorted_events_by_hour)

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)
