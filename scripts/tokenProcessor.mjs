import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import { generateCSS } from './cssGenerate.mjs';

export const brand = 'ids';

const repositories = {
  foundation: {
    name: 'ids-core-foundation',
    url: 'https://github.com/i-Cell-Mobilsoft-Open-Source/ids-core-foundation.git',
  },
  web: {
    name: 'ids-core-web',
    url: 'https://github.com/i-Cell-Mobilsoft-Open-Source/ids-core-web.git',
  },
};

const TARGET_DIR = process.cwd();

const branches = {
  foundation: ['foundation'],
  web: [
    'accordion',
    'action-menu',
    'avatar',
    'buttons',
    'card',
    'checkbox',
    'chip',
    'dialog',
    'divider',
    'form-field',
    'input',
    'menu-item',
    'message',
    'paginator',
    'radio',
    'select',
    'segmented-control',
    'segmented-control-toggle',
    'snackbar',
    'switch',
    'tab',
    'tag',
    'textarea',
    'tooltip',
  ],
};

const git = simpleGit();

async function processRepository(repository) {
  for (let branch of branches[repository]) {
    const repoName = repositories[repository].name;
    const repoUrl = repositories[repository].url;
    const branchTempDir = path.join(TARGET_DIR, 'temp', repoName, branch.replace(/\//g, '-'));

    console.log(`Cloning ${repoName} with branch ${branch}...`);

    try {
      await git.clone(repoUrl, branchTempDir, ['--branch', branch]);
    } catch (error) {
      console.error(`Failed to clone ${branch}:`, error);
      process.exit(1);
    }
  }
}

async function cleanUpTempFiles() {
  console.log('Cleaning up temporary files...');

  const subDirectories = Object.values(repositories).map((repo) => repo.name);

  for (let subDirectory of subDirectories) {
    await fs.remove(path.join(TARGET_DIR, 'temp', subDirectory));
  }
}

async function processTokens() {
  // await fs.ensureDir(path.join(TARGET_DIR, 'temp'));
  // await processRepository('foundation');
  // await processRepository('web');

  generateCSS(TARGET_DIR, repositories);
  // generateTestData(TARGET_DIR, repositories);
  // await cleanUpTempFiles(subDirectories);

  console.log('Script completed successfully!');
}

processTokens().catch((error) => console.error('Error:', error));