import React, { useEffect, useState } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';


function EventsChart() {
  const [data, setData] = useState(null);
  const [topProjects, setTopProjects] = useState([]);
  let navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      console.log("in useEffect")
      const storedData = localStorage.getItem('eventsData');
      if (storedData) {
        setData(JSON.parse(storedData));
      } else {
        try {
          const response = await fetch('/events_per_hour');
          const rawData = await response.json();
          const transformedData = rawData.map(item => ({
            x: item.hour,
            y: item.total_events,
          }));
          const chartData = [{
            id: "Events",
            data: transformedData
          }];
          localStorage.setItem('eventsData', JSON.stringify(chartData));
          setData(chartData);
        } catch (error) {
          console.error('Error fetching data: ', error);
        }
      }

      const projectsData = localStorage.getItem('topProjectsData');
      let projectsChartData;
      if (projectsData) {
        projectsChartData = JSON.parse(projectsData);
      } else {
        try {
          const response = await fetch('/top_10_events_by_hour');
          const rawData = await response.json();
          localStorage.setItem('topProjectsData', JSON.stringify(rawData));
          projectsChartData = rawData;
        } catch (error) {
          console.error('Error fetching top projects data: ', error);
        }
      }

      setTopProjects(projectsChartData);
    };

    fetchData();
  }, []);

  if (!data || !topProjects.length || !topProjects) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress sx={{ color: 'primary.main', size: 60 }} itemWidth="100%" />
          <Typography variant="h6" sx={{ mt: 2 }} textAlign={"center"}>
            Loading, please wait...
          </Typography>
      </Box>
    );
  }

  // Function to generate tooltip content
  const getTooltip = (point) => {
    const hourData = topProjects.find(p => p.hour === point.point.data.x);
    if (!hourData) return null;

    return (
      <div style={{ padding: '10px', background: 'white' }}>
        <strong>Hour: {point.point.data.x}</strong>
        <ul>
          {hourData.projects.map((project, index) => (
            <li key={index}>{project.project_name}: {project.event_count} events</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Box>

      <Box height={500} sx={{ width: '90%'}} alignItems='center'>
        <h2 style={{ textAlign: "center" }}>Total Events Per Hour</h2>
        <ResponsiveLine
          data={data}
          tooltip={getTooltip}
          margin={{ top: 50, right: 110, bottom: 50, left: 100 }}
          xScale={{ type: 'point' }}
          yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: true, reverse: false }}
          curve="natural"
          axisTop={null}
          axisRight={null}
          gridXValues={1}
          axisBottom={{
            orient: 'bottom',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Hour',
            legendOffset: 36,
            legendPosition: 'middle',
            tickValues: 6
          }}
          axisLeft={{
            orient: 'left',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Total Events',
            legendOffset: -60,
            legendPosition: 'middle'
          }}
          colors={{ scheme: 'category10' }}
          pointSize={10}
          pointColor={{ from: 'color', modifiers: [] }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          useMesh={true}
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'column',
              justify: false,
              translateX: 100,
              translateY: 0,
              itemsSpacing: 0,
              itemDirection: 'left-to-right',
              itemWidth: 80,
              itemHeight: 20,
              itemOpacity: 0.75,
              symbolSize: 12,
              symbolShape: 'circle',
              symbolBorderColor: 'rgba(0, 0, 0, .5)',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemBackground: 'rgba(0, 0, 0, .03)',
                    itemOpacity: 1,
                  }
                }
              ]
            }
          ]}
        />
      </Box>
      <Box sx={{mt:9}} display="flex" justifyContent="flex-end" gap={2} m={2}>
        <Button variant="contained" color="primary" onClick={() => navigate('/top20watchlistbyhour')}>Watch Event Heatmap Per Hour</Button>
        <Button variant="contained" color="primary" onClick={() => navigate('/top20watchlist')}>Top 20 Projects By Event</Button>
      </Box>
    </Box>
  );
}

export default EventsChart;
