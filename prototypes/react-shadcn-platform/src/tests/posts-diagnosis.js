/**
 * Simple Node.js script to diagnose posts navigation and image issues
 * Run with: node src/tests/posts-diagnosis.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to read and parse the enhanced alumni posts
function loadPostsData() {
  try {
    const filePath = path.join(__dirname, '../lib/mock-data/enhanced-alumni-posts.ts');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Extract the posts array from the TypeScript file
    const arrayStart = fileContent.indexOf('export const enhancedAlumniPosts: AlumniPost[] = [');
    const arrayEnd = fileContent.lastIndexOf(']');
    
    if (arrayStart === -1 || arrayEnd === -1) {
      throw new Error('Could not find posts array in file');
    }
    
    // Extract the array content and convert to JSON-parseable format
    const arrayContent = fileContent.substring(arrayStart, arrayEnd + 1);
    const jsonContent = arrayContent
      .replace('export const enhancedAlumniPosts: AlumniPost[] = ', '')
      .replace(/'/g, '"')
      .replace(/(\w+):/g, '"$1":')
      .replace(/,(\s*[}\]])/g, '$1');
    
    const posts = JSON.parse(jsonContent);
    return posts;
  } catch (error) {
    console.error('Error loading posts data:', error.message);
    return [];
  }
}

// Function to check if image files exist
function checkImageFiles(posts) {
  console.log('\n=== IMAGE FILES ANALYSIS ===');
  
  const postsWithImages = posts.filter(post => post.image);
  console.log(`Posts with images: ${postsWithImages.length}`);
  
  const publicDir = path.join(__dirname, '../../public');
  const missingImages = [];
  const existingImages = [];
  
  postsWithImages.forEach(post => {
    if (post.image) {
      const imagePath = path.join(publicDir, post.image);
      
      if (fs.existsSync(imagePath)) {
        existingImages.push(post.image);
        console.log(`✅ ${post.image}`);
      } else {
        missingImages.push(post.image);
        console.log(`❌ ${post.image} - File not found`);
      }
    }
  });
  
  console.log(`\nSummary:`);
  console.log(`- Existing images: ${existingImages.length}`);
  console.log(`- Missing images: ${missingImages.length}`);
  
  if (missingImages.length > 0) {
    console.log('\n🚨 ISSUE IDENTIFIED: Missing image files prevent posts from displaying properly');
    console.log('These images need to be added to the public directory:');
    missingImages.forEach(img => console.log(`  ${img}`));
  }
  
  return { existing: existingImages, missing: missingImages };
}

// Function to check directory structure
function checkDirectoryStructure() {
  console.log('\n=== DIRECTORY STRUCTURE ===');
  
  const publicDir = path.join(__dirname, '../../public');
  const imagesDir = path.join(publicDir, 'images');
  const opportunitiesDir = path.join(imagesDir, 'opportunities');
  
  console.log(`Public directory exists: ${fs.existsSync(publicDir)}`);
  console.log(`Images directory exists: ${fs.existsSync(imagesDir)}`);
  console.log(`Opportunities directory exists: ${fs.existsSync(opportunitiesDir)}`);
  
  if (fs.existsSync(imagesDir)) {
    try {
      const files = fs.readdirSync(imagesDir, { recursive: true });
      console.log(`Files in images directory: ${files.length}`);
      files.forEach(file => console.log(`  ${file}`));
    } catch (error) {
      console.log('Error reading images directory:', error.message);
    }
  }
}

// Function to analyze posts data
function analyzePosts(posts) {
  console.log('\n=== POSTS DATA ANALYSIS ===');
  console.log(`Total posts: ${posts.length}`);
  
  const statusCounts = posts.reduce((acc, post) => {
    acc[post.status] = (acc[post.status] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Posts by status:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
  
  const approvedPosts = posts.filter(p => p.status === 'approved');
  const postsWithImages = approvedPosts.filter(p => p.image);
  const postsWithHTML = approvedPosts.filter(p => p.content.includes('<'));
  const postsWithEngagement = approvedPosts.filter(p => p.likes > 0 || p.comments.length > 0);
  
  console.log(`\nApproved posts (visible in feed): ${approvedPosts.length}`);
  console.log(`Posts with images: ${postsWithImages.length}`);
  console.log(`Posts with HTML content: ${postsWithHTML.length}`);
  console.log(`Posts with engagement: ${postsWithEngagement.length}`);
  
  // Check personalization filtering
  const mockUserDomains = ['Research', 'Internships', 'Medical', 'Computer Science'];
  const personalizedPosts = approvedPosts.filter(post => 
    mockUserDomains.some(domain => 
      post.category === domain || post.tags.some(tag => tag.toLowerCase().includes(domain.toLowerCase()))
    )
  );
  
  console.log(`\nPersonalized posts (for user with domains [${mockUserDomains.join(', ')}]): ${personalizedPosts.length}`);
  
  if (personalizedPosts.length === 0) {
    console.log('🚨 ISSUE: No posts match user preferences - filtering too restrictive');
  }
  
  return {
    total: posts.length,
    approved: approvedPosts.length,
    withImages: postsWithImages.length,
    personalized: personalizedPosts.length
  };
}

// Function to check Yale and CSIS opportunities
function checkOpportunities() {
  console.log('\n=== YALE & CSIS OPPORTUNITIES CHECK ===');
  
  try {
    const opportunitiesPath = path.join(__dirname, '../lib/mock-data/alumni-opportunities.ts');
    const content = fs.readFileSync(opportunitiesPath, 'utf8');
    
    const yaleMatch = content.match(/world\.yale\.edu/g);
    const csisMatch = content.match(/csis\.org/g);
    const oldYaleMatch = content.match(/scholarshipsads\.com/g);
    const oldCsisMatch = content.match(/opportunitiescircle\.com/g);
    
    console.log(`Yale opportunities with correct link (world.yale.edu): ${yaleMatch ? yaleMatch.length : 0}`);
    console.log(`CSIS opportunities with correct link (csis.org): ${csisMatch ? csisMatch.length : 0}`);
    console.log(`Old Yale links (scholarshipsads.com): ${oldYaleMatch ? oldYaleMatch.length : 0}`);
    console.log(`Old CSIS links (opportunitiescircle.com): ${oldCsisMatch ? oldCsisMatch.length : 0}`);
    
    if (yaleMatch && csisMatch && !oldYaleMatch && !oldCsisMatch) {
      console.log('✅ Yale and CSIS links have been updated correctly');
    } else {
      console.log('⚠️  Some links may still need updating');
    }
    
  } catch (error) {
    console.log('Error checking opportunities file:', error.message);
  }
}

// Main execution
function main() {
  console.log('🔍 POSTS NAVIGATION & IMAGE LOADING DIAGNOSIS');
  console.log('='.repeat(50));
  
  const posts = loadPostsData();
  
  if (posts.length === 0) {
    console.log('❌ Could not load posts data');
    return;
  }
  
  const analysis = analyzePosts(posts);
  checkDirectoryStructure();
  const imageCheck = checkImageFiles(posts);
  checkOpportunities();
  
  console.log('\n=== DIAGNOSIS SUMMARY ===');
  console.log(`Total posts loaded: ${analysis.total}`);
  console.log(`Approved posts (visible): ${analysis.approved}`);
  console.log(`Posts with images: ${analysis.withImages}`);
  console.log(`Personalized posts: ${analysis.personalized}`);
  console.log(`Missing image files: ${imageCheck.missing.length}`);
  
  console.log('\n=== RECOMMENDATIONS ===');
  if (imageCheck.missing.length > 0) {
    console.log('1. Add missing image files to public/images/opportunities/');
  }
  if (analysis.personalized === 0) {
    console.log('2. Check personalization filtering logic - too restrictive');
  }
  console.log('3. Navigate to Member Dashboard → Feed tab to see posts');
  console.log('4. Posts are there, but images may not load due to missing files');
}

// Run the diagnosis
main();