/**
 * Flow Activator Script - Activates the latest version of specified Salesforce flows in selected orgs.
 *
 * Author: Anush Poudel
 * Source: https://github.com/anushpoudel/flow-activator-js.git
 */

import { execSync } from 'child_process';
import axios from 'axios';
import prompts from 'prompts';
import figlet from 'figlet';

/**
 * Display ASCII art
 * @param {string} text - Text to convert to ASCII art
 */
const displayAsciiArt = (text) => {
  try {
    const asciiArt = figlet.textSync(text, { horizontalLayout: 'default', font: 'small' });
    console.log(asciiArt);
  } catch (error) {
    console.error(`Error generating ASCII art: ${error.message}`);
  }
};

/**
 * Retrieve authenticated Salesforce orgs
 * @returns {Promise<Array>} List of active connected orgs
 */
const getAuthenticatedOrgs = async () => {
  try {
    const result = execSync('sfdx force:org:list --json', { encoding: 'utf-8' });
    const { nonScratchOrgs = [] } = JSON.parse(result).result;
    return nonScratchOrgs.filter(org => org.connectedStatus === 'Connected');
  } catch (error) {
    console.error(`Error retrieving orgs: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Retrieve Salesforce instance details
 * @param {string} orgAlias - Alias of the Salesforce org
 * @returns {Promise<Object>} Salesforce instance details including access token and URL
 */
const getSfInstance = async (orgAlias) => {
  try {
    const result = execSync(`sfdx force:org:display -u ${orgAlias} --json`, { encoding: 'utf-8' });
    const { accessToken, instanceUrl } = JSON.parse(result).result;
    return { accessToken, instanceUrl };
  } catch (error) {
    console.error(`Error retrieving org details: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Activate the latest version of a Salesforce Flow
 * @param {string} flowApiName - API name of the Flow
 * @param {string} accessToken - Salesforce access token
 * @param {string} instanceUrl - Salesforce instance URL
 */
const activateLatestFlow = async (flowApiName, accessToken, instanceUrl) => {
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  try {
    // Query the latest flow version
    const toolingQuery = `SELECT Id, VersionNumber FROM Flow WHERE Definition.DeveloperName = '${flowApiName}' ORDER BY VersionNumber DESC LIMIT 1`;
    let response = await axios.get(`${instanceUrl}/services/data/v59.0/tooling/query`, { headers, params: { q: toolingQuery } });
    const [latestFlow] = response.data.records || [];

    if (!latestFlow) {
      console.log(`Flow '${flowApiName}' not found.`);
      return;
    }

    const { Id: latestVersionId, VersionNumber: latestVersionNumber } = latestFlow;

    // Query the FlowDefinition to get the Id
    const definitionQuery = `SELECT Id FROM FlowDefinition WHERE DeveloperName = '${flowApiName}'`;
    response = await axios.get(`${instanceUrl}/services/data/v59.0/tooling/query`, { headers, params: { q: definitionQuery } });
    const [flowDefinition] = response.data.records || [];

    if (!flowDefinition) {
      console.log(`FlowDefinition for '${flowApiName}' not found.`);
      return;
    }

    const { Id: flowDefinitionId } = flowDefinition;

    // Update the FlowDefinition to activate the latest version
    const metadata = { Metadata: { activeVersionNumber: latestVersionNumber } };
    await axios.patch(`${instanceUrl}/services/data/v59.0/tooling/sobjects/FlowDefinition/${flowDefinitionId}`, metadata, { headers });

    // Verify the update
    const verificationQuery = `SELECT ActiveVersionId FROM FlowDefinition WHERE Id = '${flowDefinitionId}'`;
    response = await axios.get(`${instanceUrl}/services/data/v59.0/tooling/query`, { headers, params: { q: verificationQuery } });
    const [verificationResult] = response.data.records || [];

    if (verificationResult?.ActiveVersionId === latestVersionId) {
      console.log(`Successfully activated flow '${flowApiName}' to version ${latestVersionNumber}.`);
    } else {
      console.log(`Failed to verify activation of flow '${flowApiName}' to version ${latestVersionNumber}.`);
    }
  } catch (error) {
    console.error(`Error activating flow: ${error.message}`);
  }
};

/**
 * Main function to prompt user input and activate flows in selected orgs
 */
const main = async () => {
  displayAsciiArt('Flow Activator');
  console.log('Source: https://github.com/anushpoudel/flow-activator-js.git\n');

  const flowQuestion = {
    type: 'text',
    name: 'flowNames',
    message: '🔍 Enter the flow API names separated by semi-colons:',
    validate: value => value ? true : 'Please enter at least one flow name',
    format: input => input.split(';').map(name => name.trim()),
  };

  const flowAnswers = await prompts(flowQuestion);
  if (!flowAnswers.flowNames) {
    console.log('Operation cancelled.');
    return;
  }

  const orgs = await getAuthenticatedOrgs();
  const orgChoices = orgs.map(org => ({ title: org.alias, value: org.alias }));

  const orgQuestions = [
    {
      type: 'autocompleteMultiselect',
      name: 'selectedOrgs',
      message: '🔍 Select the orgs to activate flows in:',
      instructions: 'Type to search, use arrow keys to navigate, space to select, enter to confirm',
      choices: orgChoices,
      validate: value => value.length > 0 ? true : 'You must select at least one org',
    },
    {
      type: 'confirm',
      name: 'confirmation',
      message: (prev, values) => `✅ You have selected ${values.selectedOrgs.length} orgs. Do you want to proceed?`,
      initial: true,
    },
  ];

  const orgAnswers = await prompts(orgQuestions);
  if (!orgAnswers.confirmation) {
    console.log('Operation cancelled.');
    return;
  }

  for (const orgAlias of orgAnswers.selectedOrgs) {
    console.log(`🚀 Activating flows in org: ${orgAlias}`);
    const { accessToken, instanceUrl } = await getSfInstance(orgAlias);
    for (const flowApiName of flowAnswers.flowNames) {
      await activateLatestFlow(flowApiName, accessToken, instanceUrl);
    }
  }
};

// Start the main function and catch any unhandled errors
main().catch(error => console.error(`Error: ${error.message}`));
