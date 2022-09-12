const https = require('https')
const fs = require('fs')
var path = require('path');

// This script takes the deployment.json generated by CI/CD and fetches the IPFS hashes of the current deployments of each subgraph
// Pulls the deployment.json from "https://raw.githubusercontent.com/messari/subgraphs/master/deployment/deployment.json"
// Assumes the structure is "subgraphs">{FORK}>{PROTOCOL}>{NETWORK}>"messari"
// The name comes from the string on the "messari" key under the network. If this key is not available, attempts to assume the name as "messari/{PROTOCOL}-{NETWORK}"

const url = "https://raw.githubusercontent.com/messari/subgraphs/master/deployment/deployment.json";
const liveDeployments = {};
const listedNoName = {};
https.get(url, res => {
    let data = '';
    res.on('data', chunk => {
        data += chunk;
    });
    res.on('end', () => {
        data = JSON.parse(data);
        const firstLevelKeys = Object.keys(data.subgraphs)
        firstLevelKeys.forEach(x => {
            Object.keys(data.subgraphs[x]).forEach(y => {
                Object.keys(data.subgraphs[x][y]).forEach(network => {
                    if (!data.subgraphs[x][y][network].messari) {
                        listedNoName['messari' + '/' + y + '-' + network] = true;
                        liveDeployments['messari' + '/' + y + '-' + network] = "";
                    } else {
                        liveDeployments[data.subgraphs[x][y][network].messari] = "";
                    }
                })
            })
        })

        const depIdPromArr = Object.keys(liveDeployments).map(key => {
            const options = {
                hostname: 'api.thegraph.com',
                path: '/subgraphs/name/' + key,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            const dataQuery = JSON.stringify({
                query: `query DeploymentIDs {
                    _meta {
                      deployment
                    }
                  }`,
            });
            return getData(key, dataQuery, options)
        })


        Promise.all(depIdPromArr).then(val => {
            const formattedDeployments = {}
            val.forEach((dep, idx) => {
                if (dep) {
                    if (dep._meta) {
                        formattedDeployments[Object.keys(liveDeployments)[idx]] = {
                            IPFS_Hash: dep._meta.deployment || 'N/A',
                            issues: []
                        }
                    }
                }
                if (!formattedDeployments[Object.keys(liveDeployments)[idx]]) {
                    formattedDeployments[Object.keys(liveDeployments)[idx]] = {
                        IPFS_Hash: 'N/A',
                        issues: ["Could not pull either current subgraph IPFS hash given subgraph name. Query attempted on _meta entity at endpoint https://api.thegraph.com/subgraphs/name/" + Object.keys(liveDeployments)[idx]]
                    }
                }
                if (listedNoName[Object.keys(liveDeployments)[idx]]) {
                    formattedDeployments[Object.keys(liveDeployments)[idx]].issues.push("deployment.json file does not have subgraph name string under the 'messari' key. Attempted to construct subgraph name from 'messari/(PROTOCOL)-(NETWORK)");
                }
                // if (!dep._meta.deployment) {
                //     formattedDeployments[Object.keys(liveDeployments)[idx]].issues.push("Could not pull either current subgraph IPFS hash given subgraph name. Query attempted on _meta entity at endpoint https://api.thegraph.com/subgraphs/name/" + Object.keys(liveDeployments)[idx])
                // }
            })

            const storeData = () => {
                try {
                    const nowDate = new Date().getMonth().toString() + '-' + new Date().getDate().toString() + '-' + new Date().getFullYear().toString()
                    const jsonPath = path.join(__dirname, 'Deployments_' + nowDate + '.json');
                    fs.writeFileSync(jsonPath, JSON.stringify(formattedDeployments, null, '\t'))

                } catch (err) {
                    console.error(err)
                }
            }
            storeData()
        })
    })
}).on('error', err => {
    console.log(err.message);
}).end()

async function getData(url, dataQuery, options) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (d) => {
                data += d;
            });
            res.on('end', () => {
                try {
                    const parsedData = { ...JSON.parse(data).data, subgraphName: url }
                    resolve(parsedData)
                } catch (e) {
                    reject(e.message)
                }
            });
        });
        req.write(dataQuery);
        req.end();
    })
}