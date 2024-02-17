import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, CircularProgress, Typography, Button, FormControl, Select, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Top20Chart() {
  const [projects, setProjects] = useState([]);
  const [displayCount, setDisplayCount] = useState(20); // Default display count set to 20
  let navigate = useNavigate();

  const borderStyle = {
    borderWidth: 2, // Specify the thickness of the border
    borderColor: '#000000', // You can use any color
    borderStyle: 'solid',
  };

  useEffect(() => {
    const fetchData = async () => {
      const storedDataString = localStorage.getItem('top20eventsData');
      const storedData = storedDataString ? JSON.parse(storedDataString) : null;

      if (storedData && storedData.id === "Events") {
        setProjects(storedData.data);
      } else {
        try {
          const response = await fetch('/top_20_watch_events');
          const rawData = await response.json();
          const transformedData = rawData.map(item => ({
            project_name: item.project_name,
            watch_events: item.watch_events,
          }));
          localStorage.setItem('top20eventsData', JSON.stringify({ id: "Events", data: transformedData }));
          setProjects(transformedData);
        } catch (error) {
          console.error('Error fetching data: ', error);
        }
      }
    };

    fetchData();
  }, []);

  const handleDisplayCountChange = (event) => {
    setDisplayCount(event.target.value);
  };

  if (!projects || !projects.length) {
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
    <Box m={10}>
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
        <Button variant="contained" color="primary" onClick={() => navigate('/top20watchlistbyhour')}>Watch Event Heatmap Per Hour</Button>
        <Button variant="contained" color="primary" onClick={() => navigate('/')}>Events Per Hour</Button>
      </Box>
      </Box>
      <h2 style={{ textAlign: "center" }}>Top 20 Projects By Event Count</h2>
      <TableContainer component={Paper}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow sx={borderStyle}>
              <TableCell sx={borderStyle}><Typography variant='h6'><b>Project Name</b></Typography></TableCell>
              <TableCell sx={borderStyle} align="right"><Typography variant='h6'><b>Watch Events</b></Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.slice(0, displayCount).map((project) => (
              <TableRow sx={borderStyle} key={project.project_name}>
                <TableCell sx={borderStyle} component="th" scope="row">
                <Typography>{project.project_name}</Typography>
                </TableCell>
                <TableCell sx={borderStyle} align="right"><Typography>{project.watch_events}</Typography></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Top20Chart;
