#!/usr/bin/env node

const Database = require('better-sqlite3');
const DocumentationDataSources = require('./src/lib/graphql/datasources/DocumentationDataSources.cjs');
const path = require('path');

async function debugDataSource() {
  const dbPath = path.join(__dirname, 'src/lib/database/database.db');
  console.log('🔍 Testing DocumentationDataSources...');
  
  try {
    const db = new Database(dbPath);
    console.log('✅ Database connected');
    
    // Initialize data source
    const dataSources = new DocumentationDataSources('../docs/progress', db);
    console.log('✅ DataSources initialized');
    
    // Try to get all phases
    console.log('\n📊 Calling getAllPhases...');
    const phases = await dataSources.getAllPhases();
    console.log(`✅ Got ${phases.length} phases`);
    
    if (phases.length > 0) {
      console.log('\n🎯 First phase:');
      console.log(JSON.stringify(phases[0], null, 2));
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugDataSource();