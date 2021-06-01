# Executive Dashboard Web

The website for the Executive Dashboard

Powered by IBM Cloud

- Node.js hosted on IBM Cloud at https://exec-dashboard.au-syd.mybluemix.net/
- Authentication via IBM Cloud AppID
- Data stored on IBM Cloud Object Storage (COS)

## Installation

Installation onto Cloud Foundry is done automatically using pushes and merges to the `master` branch using code pipeline.

If you are installing locally for development there are a few extra steps.

After pulling or cloning the repo, you must run the following 2 commands

```
npm install
npm test
npm run build(-dev)
```

Before starting the server, if you are running locally you need a localdev-config.json file in the root of the project folder, which contains the VCAP_SERVICES variable from cloud foundry or a json object with the same format. The variable can be found in `Cloud Foundry Service > Runtime > Environment variables`

To start the server run `npm start` to start the server with debug messages run `npm run debug`

## Development

We recommend VSCode for development as all validation and settings have been fine tuned to support and work seamlessly with VSCode extensions. The exec-dash.code-workspace provides suggested settings and extensions as a minimum.

We reccomend also adding the following

Settings

```
"editor.formatOnPaste": true
"editor.formatOnSave": true
"files.autoSave": "afterDelay"
"eslint.alwaysShowStatus": true
```

Extensions

```
coenraads.bracket-pair-colorizer
hookyqr.beautify
eamodio.gitlens
eg2.vscode-npm-script
christian-kohler.npm-intellisense
visualstudioexptteam.vscodeintellicode
```

## Testing

We only recently added a few testing modules for certain units of the application, please make sure you run `npm test` and make sure the code passes all tests before running or pushing changes.

A better visual for the test results can be found by opening the index.html file in the coverage folder after running the tests.

## Documentation

`src` folder contains all client side code such as css, fonts, images, and js. Compiled using webpack. The js files use es6 formatting, the css are compiles from scss.
`routes` folder contains the functions or endpoints for specific route groups defined in app.js. These should never contain code that connects to any external source such as a database.
`views` folder contains the .ejs templates for rendering web pages.
`includes` folder contains functions, configurations and utilities for interacting with the backend. This should be the only folder with code that interacts with external sources such as databases and files should be modular enough to include in a different project without further changes.
`public` folder contains compiled resources from `src`. DO NOT edit anything in here as this folder is DELETED and replaced when `npm run build(-dev)` is run!

`app.js` should only contain imports and startup functions such as configurations, event registering and runtime variables

## Standards

To keep things standard, please follow and correct any errors and warnings before pushing.

## Common Issues

If you aren't using VSCode These wont help. Sorry :/

![Helper Image](https://jp-tok.git.cloud.ibm.com/Lee.Tzilantonis/readme-refs/raw/d8391ec73987bc1fcbb67cf09afa706e40075bbb/vscode-bottom-bar.jpg "VSCode Bottom Bar")

1. Check which branch you are currently editing
2. Check how many errors and warnings you have for the project
3. Check whether your file is using spaces or tabs for indentation
4. Check the formatting of the file
5. Check the line endings for the file, we use LF not CRLF

For issues, access, or other enquiries contact:

- Samuel Pike - Samuel.Pike1@ibm.com
