import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, CircularProgress, Typography, Button, FormControl, Select, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function CustomHeatmapTable() {
  const [projects, setProjects] = useState([]);
  const [displayCount, setDisplayCount] = useState(10);
  let navigate = useNavigate();

  const borderStyle = {
    borderWidth: 2, // Specify the thickness of the border
    borderColor: '#000000', // You can use any color
    borderStyle: 'solid',
  };

  useEffect(() => {
    const fetchData = async () => {
      // Check for data in local storage
      const storedData = localStorage.getItem('top_20_watch_events_hourly');
      if (storedData) {
        setProjects(JSON.parse(storedData)); // Use data from local storage if available
      } else {
        try {
          const response = await fetch('/top_20_watch_events_hourly');
          const rawData = await response.json();
          // Transform data to include hourly events
          const transformedData = rawData.map(item => ({
            project_name: item.project_name,
            hourly_watch_events: item.hourly_watch_events,
          }));
          setProjects(transformedData);
          // Save the fetched data to local storage for future use
          localStorage.setItem('top_20_watch_events_hourly', JSON.stringify(transformedData));
        } catch (error) {
          console.error('Error fetching data: ', error);
        }
      }
    };
  
    fetchData();
  }, []);
  
  const handleDisplayCountChange = (event) => {
    setDisplayCount(event.target.value); // Update displayCount based on user selection
  };

  const maxCount = projects.reduce((max, project) => {
    return Math.max(max, ...Object.values(project.hourly_watch_events));
  }, 0);
  
  const getColor = (count) => {
    // Define the three key colors of the gradient
    const colors = [
      { r: 102, g: 187, b: 106 }, // Green color
      { r: 255, g: 167, b: 38 },  // Orange color
      { r: 33, g: 150, b: 243 },  // Blue color
    ];
  
    if (count === 0) {
      return `rgba(247, 247, 247, 1)`; // Very faint grey if no events are present
    } else {
      // Determine the ratio of count to maxCount, scaled to the number of color segments
      let ratio = (count / maxCount) * (colors.length - 1);
      let firstColorIndex = Math.floor(ratio);
      let secondColorIndex = Math.ceil(ratio);
      ratio -= firstColorIndex; // Ratio within the segment
  
      // Interpolate between the two colors based on ratio
      const r = Math.round(colors[firstColorIndex].r + (colors[secondColorIndex].r - colors[firstColorIndex].r) * ratio);
      const g = Math.round(colors[firstColorIndex].g + (colors[secondColorIndex].g - colors[firstColorIndex].g) * ratio);
      const b = Math.round(colors[firstColorIndex].b + (colors[secondColorIndex].b - colors[firstColorIndex].b) * ratio);
  
      return `rgba(${r}, ${g}, ${b}, 1)`;
    }
  };

  if (!projects.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress sx={{ color: 'primary.main', size: 60 }} itemWidth="100%" />
          <Typography variant="h6" sx={{ mt: 2 }} textAlign={"center"}>
            Loading, please wait...
          </Typography>
      </Box>
    );
  }

  return (
    <Box m={5}>
      <Box display="flex" justifyContent={"center"}>
      <Box display="flex" justifyContent="flex-start" gap={2} m={2} mr={"10%"} >
        {/* Dropdown Menu for Selecting Number of Projects to Display */}
        <Typography variant='h6' sx= {{}}> Select number of projects to view </Typography>
        <FormControl variant="outlined" size="small">
          <Select
            value={displayCount}
            onChange={handleDisplayCountChange}
            displayEmpty
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={25}>24</MenuItem>
          </Select>
        </FormControl>
        {/* Existing navigation buttons... */}
      </Box>
      <Box display="flex" justifyContent="flex-end" gap={2} m={2} >
        <Button variant="contained" color="primary" onClick={() => navigate('/top20Watchlist')}>Top 20 Projects By Events</Button>
        <Button variant="contained" color="primary" onClick={() => navigate('/')}>Events Per Hour</Button>
      </Box>
      </Box>
      <h2 style={{ textAlign: "center" }}>Top 20 Projects By Event Count Each Hour</h2>
      <TableContainer component={Paper} >
        <Table aria-label="simple table">
          <TableHead>
            <TableRow sx={borderStyle}>
              <TableCell sx={borderStyle}><Typography variant='h6'><b>Project Name  /  Hour</b></Typography></TableCell>
              {Array.from({ length: 24 }, (_, i) => (
                <TableCell sx={borderStyle} key={i} align="right"><Typography><b>Hr {i}</b></Typography></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
              {projects.slice(0, displayCount).map((project) => ( // Slice projects based on displayCount
              <TableRow key={project.project_name} sx={borderStyle}>
                <TableCell component="th" scope="row" sx={borderStyle}>
                <Typography><b>{project.project_name}</b></Typography>
                </TableCell>
                {Array.from({ length: 24 }).map((_, index) => {
                  const count = project.hourly_watch_events[index] || 0;
                  return (
                    <TableCell key={index} align="right" sx={borderStyle} style={{ backgroundColor: getColor(count) }}>
                      {count}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default CustomHeatmapTable;
