// Google Sheets API handling
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

let gapiInited = false;
let gisInited = false;

// Initialize the Google API client
async function initializeGapiClient() {
  try {
    await gapi.client.init({
      apiKey: 'AIzaSyDfqZlRynXS-Sa4-8UTjRdXa5zicDbJbsc',
      discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    console.log('GAPI client initialized');
  } catch (err) {
    console.error('Error initializing GAPI client:', err);
  }
}

// Initialize Google Identity Services
function gisInit() {
  try {
    gisInited = true;
    console.log('GIS initialized');
  } catch (err) {
    console.error('Error initializing GIS:', err);
  }
}

// Enable buttons when both APIs are initialized
function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById('authorize_button').style.visibility = 'visible';
  }
}

// Handle the authorization flow
async function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
    await listMajors();
  };

  if (gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({prompt: 'consent'});
  } else {
    tokenClient.requestAccessToken({prompt: ''});
  }
}

// Load the data from the spreadsheet
async function loadSheetData(spreadsheetId, range) {
  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    });
    
    const result = response.result;
    const numRows = result.values ? result.values.length : 0;
    console.log(`${numRows} rows retrieved.`);
    return result.values;
  } catch (err) {
    console.error('Error loading sheet data:', err);
    return null;
  }
}

// Display the data in a table with improved formatting
function displaySheetData(data) {
  const table = document.getElementById('sheet-data');
  table.innerHTML = '';
  
  if (!data || data.length === 0) {
    table.innerHTML = '<tr><td colspan="5" class="text-center">No data found.</td></tr>';
    return;
  }

  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  data[0].forEach(column => {
    const th = document.createElement('th');
    th.textContent = column;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create body
  const tbody = document.createElement('tbody');
  for (let i = 1; i < data.length; i++) {
    const row = document.createElement('tr');
    data[i].forEach((cell, index) => {
      const td = document.createElement('td');
      
      // Add special formatting for certain columns
      if (index === 0) { // Category column
        td.className = 'text-muted';
      } else if (index === data[i].length - 1) { // Last column (usually score/result)
        td.className = 'text-end';
        // Add color coding based on value if it's a number
        const value = parseFloat(cell);
        if (!isNaN(value)) {
          if (value > 80) td.className += ' text-success';
          else if (value < 40) td.className += ' text-danger';
          else td.className += ' text-warning';
        }
      }
      
      td.textContent = cell;
      row.appendChild(td);
    });
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
} 