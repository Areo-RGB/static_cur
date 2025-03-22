// Google Sheets API configuration
const SPREADSHEET_ID = '136NX0510MEeGeAxMYErxMGgpo5VZ2ph68eSKMfsUw-E';
const DEFAULT_RANGE = 'A1:E1010';
const API_KEY = 'AIzaSyDfqZlRynXS-Sa4-8UTjRdXa5zicDbJbsc';
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];

// Global variables for API initialization
let gapiInited = false;
let gisInited = false;
let gapiClientLoaded = false;

// Global variable to track current sort state
let currentSort = {
  column: -1,
  ascending: true
};

// Initialize the Google API
async function initGapi() {
  if (gapiInited && gapiClientLoaded) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    gapi.load('client', {
      callback: () => {
        gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: DISCOVERY_DOCS,
        }).then(() => {
          gapiInited = true;
          gapiClientLoaded = true;
          console.log('Google API initialized successfully');
          resolve();
        }).catch(error => {
          console.error('Error initializing Google API:', error);
          reject(error);
        });
      },
      onerror: (error) => {
        console.error('Error loading Google API client:', error);
        reject(error);
      }
    });
  });
}

// Check if both APIs are loaded and ready
function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    if (window.location.pathname.includes('overview.html')) {
      loadDefaultData();
    }
  }
}

// Load data from the spreadsheet
async function loadDefaultData() {
  try {
    if (!gapiInited) {
      document.getElementById('data-table').innerHTML = 'Please wait while we initialize the API...';
      return;
    }

    // First get the header row to set up filters
    const headerResponse = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A1:E1',
    });
    
    const headers = headerResponse.result.values[0];
    
    // Get all data
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: DEFAULT_RANGE,
    });
    
    const values = response.result.values;
    if (!values || values.length === 0) {
      document.getElementById('data-table').innerHTML = 'No data found.';
      return;
    }

    // Clear existing options
    const categoryFilter = document.getElementById('category-filter');
    const exerciseFilter = document.getElementById('exercise-filter');
    const nameFilter = document.getElementById('name-filter');
    
    categoryFilter.innerHTML = '<option value="All Categories">All Categories</option>';
    exerciseFilter.innerHTML = '<option value="All Exercises">All Exercises</option>';
    nameFilter.innerHTML = '<option value="All Athletes">All Athletes</option>';

    // Get unique values for filters
    const categories = new Set();
    const exercises = new Set();
    const names = new Set();
    
    // Skip header row when collecting filter values
    values.slice(1).forEach(row => {
      if (row[0]) categories.add(row[0].trim());
      if (row[1]) exercises.add(row[1].trim());
      if (row[2]) names.add(row[2].trim());
    });

    // Sort and populate dropdowns
    [...categories].sort().forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });

    [...exercises].sort().forEach(exercise => {
      const option = document.createElement('option');
      option.value = exercise;
      option.textContent = exercise;
      exerciseFilter.appendChild(option);
    });

    [...names].sort().forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      nameFilter.appendChild(option);
    });

    // Store the original data for filtering
    window.originalData = values;
    
    // Display initial data
    displayData(values);
    
  } catch (error) {
    console.error('Error loading data:', error);
    document.getElementById('data-table').innerHTML = 'Error loading data. Please try again later.';
  }
}

// Sort data based on column
function sortData(data, columnIndex, ascending) {
  const headers = data[0];
  const rows = data.slice(1);
  
  rows.sort((a, b) => {
    let valueA = a[columnIndex];
    let valueB = b[columnIndex];
    
    // Try to convert to numbers if possible
    const numA = parseFloat(valueA);
    const numB = parseFloat(valueB);
    if (!isNaN(numA) && !isNaN(numB)) {
      valueA = numA;
      valueB = numB;
    }
    
    if (valueA < valueB) return ascending ? -1 : 1;
    if (valueA > valueB) return ascending ? 1 : -1;
    return 0;
  });
  
  return [headers, ...rows];
}

// Display data in a table format
function displayData(values, filtered = false) {
  const headers = values[0];
  const rows = values.slice(1);
  
  let tableHtml = `
    <table class="table table-vcenter card-table" id="data-table">
      <thead>
        <tr>
          ${headers.map((header, index) => `
            <th style="cursor: pointer;" onclick="handleSort(${index})">
              ${header.replace(/▲|▼/g, '')}
              <span class="sort-indicator">
                ${currentSort.column === index ? (currentSort.ascending ? '▲' : '▼') : ''}
              </span>
            </th>
          `).join('')}
        </tr>
      </thead>
      <tbody>
  `;
  
  rows.forEach(row => {
    const performanceValue = parseFloat(row[3]);
    let rowClass = '';
    
    if (!isNaN(performanceValue)) {
      if (row[1].toLowerCase().includes('sprint') || 
          row[1].toLowerCase().includes('schnelligkeit') || 
          row[1].toLowerCase().includes('antritt')) {
        if (performanceValue <= 3.5) rowClass = 'table-success';
        else if (performanceValue <= 4.0) rowClass = 'table-warning';
        else rowClass = 'table-danger';
      } else {
        if (performanceValue >= 8.5) rowClass = 'table-success';
        else if (performanceValue >= 7.0) rowClass = 'table-warning';
        else rowClass = 'table-danger';
      }
    }
    
    tableHtml += `
      <tr class="${rowClass}">
        ${row.map(cell => `<td>${cell}</td>`).join('')}
      </tr>
    `;
  });
  
  tableHtml += `
      </tbody>
    </table>
  `;
  
  const container = document.getElementById('data-table');
  if (container) {
    container.innerHTML = tableHtml;
  } else {
    console.error('Data table container not found');
  }
}

// Handle sort click
function handleSort(columnIndex) {
  if (currentSort.column === columnIndex) {
    // If clicking the same column, reverse the sort order
    currentSort.ascending = !currentSort.ascending;
  } else {
    // If clicking a new column, sort ascending by default
    currentSort.column = columnIndex;
    currentSort.ascending = true;
  }
  
  // Get the current data and sort it
  const table = document.querySelector('#data-table table');
  const data = Array.from(table.querySelectorAll('tr')).map(row => 
    Array.from(row.querySelectorAll('th, td')).map(cell => cell.textContent.trim())
  );
  
  const sortedData = sortData(data, columnIndex, currentSort.ascending);
  displayData(sortedData);
  
  // Apply filters after sorting
  filterData();
}

// Filter data based on selected values
function filterData() {
  const categoryValue = document.getElementById('category-filter').value;
  const exerciseValue = document.getElementById('exercise-filter').value;
  const nameValue = document.getElementById('name-filter').value;

  if (!window.originalData) {
    console.error('Original data not found');
    return;
  }

  const headers = window.originalData[0];
  const dataRows = window.originalData.slice(1);

  // Filter the rows based on selected values
  const filteredRows = dataRows.filter(row => {
    const category = row[0]?.trim() || '';
    const exercise = row[1]?.trim() || '';
    const name = row[2]?.trim() || '';

    const categoryMatch = categoryValue === 'All Categories' || category === categoryValue;
    const exerciseMatch = exerciseValue === 'All Exercises' || exercise === exerciseValue;
    const nameMatch = nameValue === 'All Athletes' || name === nameValue;

    return categoryMatch && exerciseMatch && nameMatch;
  });

  // Display filtered data with headers
  displayData([headers, ...filteredRows]);
}

// Update UI with athlete data
function updateAthleteUI(data) {
  if (!data) {
    console.error('No data available to update UI');
    return;
  }

  // Update test count
  const testCountElement = document.getElementById('test-count');
  if (testCountElement) {
    testCountElement.textContent = data.testCount;
  }

  // Update best results
  const bestResultsElement = document.getElementById('best-results');
  if (bestResultsElement) {
    let bestResultsHtml = '<div class="list-group list-group-flush">';
    Object.entries(data.bestResults).forEach(([exercise, result]) => {
      bestResultsHtml += `
        <div class="list-group-item">
          <div class="row align-items-center">
            <div class="col">
              <div class="text-body">${exercise}</div>
              <div class="text-muted">${result}</div>
            </div>
          </div>
        </div>
      `;
    });
    bestResultsHtml += '</div>';
    bestResultsElement.innerHTML = bestResultsHtml;
  }
}

// Function to update the best results UI
function updateBestResults(results) {
  const bestResultsContainer = document.getElementById('best-results');
  if (!bestResultsContainer) {
    console.error('Best results container not found');
    return;
  }

  if (!results || results.length === 0) {
    bestResultsContainer.innerHTML = '<div class="list-group list-group-flush"><div class="list-group-item">No results found</div></div>';
    return;
  }

  // Sort results by date descending to get the most recent
  const sortedResults = results.sort((a, b) => new Date(b.date) - new Date(a.date));
  const bestResults = sortedResults.slice(0, 5); // Get top 5 results

  let html = '<div class="list-group list-group-flush">';
  bestResults.forEach(result => {
    html += `
      <div class="list-group-item">
        <div class="row align-items-center">
          <div class="col">
            <div class="text-body">${result.exercise}</div>
            <div class="text-muted">${result.result} ${result.unit}</div>
          </div>
          <div class="col-auto">
            <div class="badge ${result.improvement >= 0 ? 'bg-success' : 'bg-danger'}">
              ${result.improvement >= 0 ? '+' : ''}${result.improvement}%
            </div>
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  
  bestResultsContainer.innerHTML = html;
}

// Load athlete data from the spreadsheet
async function loadAthleteData(athleteName) {
  try {
    if (!gapiInited || !gapiClientLoaded) {
      console.error('Google API not initialized');
      return null;
    }

    console.log('Loading data for athlete:', athleteName);
    
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: DEFAULT_RANGE,
    });

    const values = response.result.values;
    if (!values || values.length === 0) {
      console.error('No data found in spreadsheet');
      return null;
    }

    // Filter data for the specific athlete
    const athleteData = values.filter(row => row[2] === athleteName);
    if (athleteData.length === 0) {
      console.error('No data found for athlete:', athleteName);
      return null;
    }

    // Update test count
    const testCount = document.getElementById('test-count');
    if (testCount) {
      testCount.textContent = athleteData.length;
    }

    // Process and display best results
    const processedResults = athleteData.map(row => ({
      exercise: row[1],
      result: row[3],
      unit: row[1].includes('Zeit') ? 's' : 'P',
      date: row[4] || new Date().toISOString(),
      improvement: calculateImprovement(row[1], row[3], athleteData)
    }));

    updateBestResults(processedResults);
    return processedResults;

  } catch (error) {
    console.error('Error loading athlete data:', error);
    return null;
  }
}

// Helper function to calculate improvement percentage
function calculateImprovement(exercise, currentResult, allResults) {
  const previousResults = allResults
    .filter(row => row[1] === exercise)
    .map(row => parseFloat(row[3]))
    .sort((a, b) => b - a);
  
  if (previousResults.length < 2) return 0;
  
  const current = parseFloat(currentResult);
  const previous = previousResults[1];
  const improvement = ((current - previous) / previous) * 100;
  
  // For time-based exercises (lower is better), invert the percentage
  return exercise.includes('Zeit') ? -improvement : improvement;
}

// Add event listeners for filters
document.addEventListener('DOMContentLoaded', function() {
  // Only add filter listeners if we're on the overview page
  if (window.location.pathname.includes('overview.html')) {
    const filters = ['category-filter', 'exercise-filter', 'name-filter'];
    
    filters.forEach(filterId => {
      const filter = document.getElementById(filterId);
      if (filter) {
        filter.addEventListener('change', filterData);
      }
    });
  }
}); 