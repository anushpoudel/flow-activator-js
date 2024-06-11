# Flow Activator

Flow Activator is a command-line tool that allows users to activate the latest version of specified flows in connected Salesforce orgs. This script supports multi-select functionality for choosing the orgs where the flows should be activated.

![activate_flows_demo](https://github.com/anushpoudel/flow-activator-js/assets/31843222/38dbf200-8f3d-45f0-87f4-ea24d180fb88)

## Prerequisites

Before running the script, ensure you have the following installed:

- **Node.js**: Ensure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org/).
- **Salesforce CLI (SF CLI)**: Salesforce CLI, which you can download from [Salesforce Developer](https://developer.salesforce.com/tools/sfdxcli).

## Installation

To install the Flow Activator script globally, run the following command:

```bash
npm install -g flow-activator
```

## Usage

1. **Run the script**:

   ```bash
   flow-activator
   ```

## Development

1. **Clone the repository**:

   ```bash
   git clone https://github.com/anushpoudel/flow-activator-js.git
   cd flow-activator-js
   ```

2. **Install the required Node.js packages**:

   ```bash
   npm install
   ```

3. **Start the script**:

   ```bash
   npm start
   ```

## Configuration

Ensure that you are authenticated to your Salesforce orgs using the SF CLI.

## Troubleshooting

- **Ensure SF CLI is installed and authenticated**:
  Ensure that you have authenticated to all the orgs you intend to use with the script. Use the `sf org list` or `sfdx force:org:list` command to list all authenticated orgs.

- **Node.js Environment Issues**:
  If you encounter issues with Node.js dependencies, ensure that you have installed all necessary packages by running `npm install`.
