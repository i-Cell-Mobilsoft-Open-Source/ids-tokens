import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import { generateCSS } from './cssGenerate.mjs';

export const brand = 'ids';
export const branches = { components: [], foundation: [] };

const TARGET_DIR = path.resolve('./temp'); 
const TEMP_REPO_DIR = path.resolve('./temp/temp-repo');
const REPO_URL = process.argv.slice(2)[0];
fs.ensureDir(TARGET_DIR);
fs.ensureDir(TEMP_REPO_DIR);
const git = simpleGit(TEMP_REPO_DIR);

if (!REPO_URL) {
    console.error("❌ Missing repository URL! Usage: node tokenProcessor.mjs -> ex. pnpm run generate -- https://github.com/group/repo.git");
    await fs.remove(TARGET_DIR);
    process.exit(1);
}
console.log("✅ Processing repo:", REPO_URL);

async function getBranches() {
    try {
        const bran = await git.listRemote(['--heads', REPO_URL]);
        const branchList = bran
            .split('\n')
            .map(line => line.split('\t')[1]?.replace(/^refs\/heads\//, '').trim()).filter(branch => branch);
            branchList.map(branch => branch === 'main' ? branches.foundation.push('main') : branches.components.push(branch));
    } catch (error) {
        console.error('❌ Error fetching branches:', error);
        await fs.remove(TARGET_DIR);
        process.exit(1);
    }
}

async function setupRepository() {
    console.log(`🤖 Cloning repository from ${REPO_URL}...`);
    await git.clone(REPO_URL, TEMP_REPO_DIR);
    await git.fetch(['--all']);
}

async function generateTempFiles(branches, destinationDir ) {
  const branchDir = path.join(TEMP_REPO_DIR);
  const files = await fs.readdir(branchDir);
  const localBranches = (await git.branch()).all;
  try {
    for (const branch of branches) {  
      if (localBranches.includes(branch)) {      
        console.log(`Branch '${branch}' already exists locally. Checking out...`); 
        await git.checkout(branch);
      } else {
        console.log(`Creating and checking out local branch '${branch}' from origin/${branch}...`);
        await git.checkout(['-b', branch, '--track', `origin/${branch}`]);
      }
      
      for (const file of files) {
        const sourceFile = path.join(branchDir, file);
        const destFile = path.join(destinationDir, branch, file);
        if (file === 'tokens') {
          const stat = await fs.lstat(sourceFile);
          if (stat.isDirectory()) {
            await fs.copy(sourceFile, destFile);
          } else {
            await fs.copyFile(sourceFile, destFile);
          }
        }
      }
    }
  }
  catch (error) {
    console.error('❌ Error checkouting branches:', error);
    await fs.remove(TARGET_DIR);
    process.exit(1);
  }
}

async function processBranches() {
  console.time('Processing tokens');
  await getBranches();
  await setupRepository();
  await generateTempFiles(branches.foundation, path.join(TARGET_DIR, 'foundation'));
  await generateTempFiles(branches.components, path.join(TARGET_DIR, 'components'));
  generateCSS();
  console.log('✅ All branches processed successfully!');   
  await fs.remove(TARGET_DIR);
  console.log('✅ Cleanup completed!');
  console.timeEnd('Processing tokens');
}

processBranches().catch((error) => console.error('Error:', error));
