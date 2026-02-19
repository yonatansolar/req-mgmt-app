const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to fetch Confluence page
app.post('/api/fetch-page', async (req, res) => {
  try {
    const { pageId, token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'API token required' });
    }

    const response = await axios.get(
      `https://solaredge-prod.atlassian.net/wiki/api/v2/pages/${pageId}?body-format=storage`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      page: {
        id: response.data.id,
        title: response.data.title,
        body: response.data.body?.storage?.value || ''
      }
    });
  } catch (error) {
    console.error('Fetch page error:', error.message);
    res.status(500).json({ 
      error: error.response?.data?.message || error.message 
    });
  }
});

// API endpoint to parse requirements from HTML
app.post('/api/parse-requirements', (req, res) => {
  try {
    const { html, pageId, pageTitle } = req.body;
    
    // Simple HTML parsing to extract requirements
    const reqs = extractRequirements(html);
    
    res.json({
      success: true,
      requirements: reqs.map(r => ({
        c: r.content,
        t: r.type || 'Req',
        s: r.section || '1',
        eid: r.id || null
      })),
      pid: pageId,
      title: pageTitle
    });
  } catch (error) {
    console.error('Parse requirements error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

function extractRequirements(html) {
  // Parse HTML and extract requirements
  const reqs = [];
  
  // Look for tables with requirements
  const tableMatch = html.match(/<table[^>]*>.*?<\/table>/gs);
  if (tableMatch) {
    tableMatch.forEach(table => {
      const rows = table.match(/<tr[^>]*>.*?<\/tr>/g) || [];
      rows.forEach((row, idx) => {
        const cells = row.match(/<td[^>]*>.*?<\/td>/g) || [];
        if (cells.length > 0) {
          const content = cells[0].replace(/<[^>]*>/g, '').trim();
          if (content) {
            reqs.push({
              id: null,
              content: content,
              type: 'Req',
              section: Math.floor(idx / 10) + 1
            });
          }
        }
      });
    });
  }
  
  return reqs;
}

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});