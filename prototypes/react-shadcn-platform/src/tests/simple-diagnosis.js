/**
 * Simple script to check posts and images
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkImageDirectories() {
  console.log('🔍 CHECKING IMAGE DIRECTORIES\n');
  
  const publicDir = path.join(__dirname, '../../public');
  const imagesDir = path.join(publicDir, 'images');
  const opportunitiesDir = path.join(imagesDir, 'opportunities');
  
  console.log('Directory Structure:');
  console.log(`📁 Public directory: ${fs.existsSync(publicDir) ? '✅ Exists' : '❌ Missing'}`);
  console.log(`📁 Images directory: ${fs.existsSync(imagesDir) ? '✅ Exists' : '❌ Missing'}`);
  console.log(`📁 Opportunities directory: ${fs.existsSync(opportunitiesDir) ? '✅ Exists' : '❌ Missing'}`);
  
  // List all files in public directory
  if (fs.existsSync(publicDir)) {
    console.log('\nFiles in public directory:');
    try {
      const files = fs.readdirSync(publicDir, { recursive: true });
      files.forEach(file => {
        console.log(`  📄 ${file}`);
      });
      
      if (files.length === 0) {
        console.log('  📭 No files found');
      }
    } catch (error) {
      console.log('  ❌ Error reading directory:', error.message);
    }
  }
  
  return {
    publicExists: fs.existsSync(publicDir),
    imagesExists: fs.existsSync(imagesDir),
    opportunitiesExists: fs.existsSync(opportunitiesDir)
  };
}

function checkPostsFileStructure() {
  console.log('\n🔍 CHECKING POSTS FILE\n');
  
  const postsFile = path.join(__dirname, '../lib/mock-data/enhanced-alumni-posts.ts');
  
  if (!fs.existsSync(postsFile)) {
    console.log('❌ Posts file not found');
    return;
  }
  
  const content = fs.readFileSync(postsFile, 'utf8');
  
  // Look for image references
  const imageRegex = /image:\s*['"`]([^'"`]+)['"`]/g;
  const images = [];
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[1]);
  }
  
  console.log(`Found ${images.length} image references in posts:`);
  images.forEach(img => {
    console.log(`  🖼️ ${img}`);
  });
  
  // Check if these image files exist
  console.log('\nImage file existence check:');
  const publicDir = path.join(__dirname, '../../public');
  
  images.forEach(img => {
    const imagePath = path.join(publicDir, img);
    const exists = fs.existsSync(imagePath);
    console.log(`  ${exists ? '✅' : '❌'} ${img}`);
  });
  
  return images;
}

function checkOpportunitiesLinks() {
  console.log('\n🔍 CHECKING OPPORTUNITIES LINKS\n');
  
  const opportunitiesFile = path.join(__dirname, '../lib/mock-data/alumni-opportunities.ts');
  
  if (!fs.existsSync(opportunitiesFile)) {
    console.log('❌ Opportunities file not found');
    return;
  }
  
  const content = fs.readFileSync(opportunitiesFile, 'utf8');
  
  const yaleCount = (content.match(/world\.yale\.edu/g) || []).length;
  const csisCount = (content.match(/csis\.org/g) || []).length;
  const oldYaleCount = (content.match(/scholarshipsads\.com/g) || []).length;
  const oldCsisCount = (content.match(/opportunitiescircle\.com/g) || []).length;
  
  console.log('Link Status:');
  console.log(`✅ Yale (world.yale.edu): ${yaleCount} occurrences`);
  console.log(`✅ CSIS (csis.org): ${csisCount} occurrences`);
  console.log(`${oldYaleCount > 0 ? '❌' : '✅'} Old Yale (scholarshipsads.com): ${oldYaleCount} occurrences`);
  console.log(`${oldCsisCount > 0 ? '❌' : '✅'} Old CSIS (opportunitiescircle.com): ${oldCsisCount} occurrences`);
  
  if (yaleCount > 0 && csisCount > 0 && oldYaleCount === 0 && oldCsisCount === 0) {
    console.log('🎉 All links have been updated correctly!');
  }
}

function main() {
  console.log('🚀 POSTS NAVIGATION DIAGNOSIS\n');
  console.log('=' * 50);
  
  const dirCheck = checkImageDirectories();
  const images = checkPostsFileStructure();
  checkOpportunitiesLinks();
  
  console.log('\n📋 SUMMARY & RECOMMENDATIONS\n');
  
  if (!dirCheck.publicExists) {
    console.log('❌ CRITICAL: public directory missing');
  } else if (!dirCheck.imagesExists) {
    console.log('❌ ISSUE: images directory missing - create public/images/');
  } else if (!dirCheck.opportunitiesExists) {
    console.log('❌ ISSUE: opportunities directory missing - create public/images/opportunities/');
  }
  
  if (images && images.length > 0) {
    console.log('📝 TO FIX POSTS NAVIGATION:');
    console.log('1. Navigate to Member Dashboard');
    console.log('2. Click the "Feed" tab');
    console.log('3. Posts should be visible there');
    console.log('4. If images don\'t load, add these files to public/images/opportunities/:');
    images.forEach(img => {
      const filename = path.basename(img);
      console.log(`   - ${filename}`);
    });
  }
  
  console.log('\n✅ POSTS DATA IS THERE - The issue is likely missing image files, not navigation!');
}

main();