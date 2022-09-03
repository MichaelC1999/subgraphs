import axios from "axios";

export const dexPoolLevel = async (deployments) => {
    const endpointsList = [];
    Object.keys(deployments).forEach((depo) => {
        if (
            !deployments[depo].indexingError &&
            deployments[depo].protocolType.toUpperCase() === "EXCHANGES"
        ) {
            endpointsList.push(deployments[depo].url);
        }
    });

    const baseQuery = `
    query MyQuery {
        protocols {
            id
            name
            type
            schemaVersion
        }
      liquidityPoolDailySnapshots (first: 100) {
        id
        name
        totalValueLockedUSD
        dailySupplySideRevenueUSD
        dailyProtocolSideRevenueUSD
        dailyTotalRevenueUSD
        dailyVolumeUSD
        dailyVolumeByTokenAmount
        dailyVolumeByTokenUSD
      }
      liquidityPoolHourlySnapshots (first: 100) {
        id
        name
        totalValueLockedUSD
        hourlySupplySideRevenueUSD
        hourlyProtocolSideRevenueUSD
        hourlyTotalRevenueUSD
        hourlyVolumeUSD
        hourlyVolumeByTokenAmount
        hourlyVolumeByTokenUSD
      }
    }`;

    const promiseArr = [];

    endpointsList.forEach((endpoint) => {
        promiseArr.push(
            axios.post(
                endpoint,
                { query: baseQuery },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            )
        );
    });

    let poolLevelData = [];
    await Promise.all(promiseArr)
        .then(
            (response) =>
            (poolLevelData = response.map((poolData) => {
                return {
                    liquidityPoolDailySnapshots: poolData?.data?.data?.liquidityPoolDailySnapshots || [],
                    liquidityPoolHourlySnapshots: poolData?.data?.data?.liquidityPoolHourlySnapshots || [],
                    url: poolData.config.url,
                    deployment: Object.keys(deployments).find((key) => deployments[key].url === poolData.config.url) || poolData.config.url.split("messari/")[1],
                };
            }))
        )
        .catch((err) => console.log(err));

    poolLevelData.forEach((protocol, idx) => {
        if (!protocol?.liquidityPoolDailySnapshots) return;
        let data = protocol.liquidityPoolDailySnapshots;
        if (!data?.length) return;
        let url = protocol.url;
        // let dataFields = Object.keys(data)

        let deploymentName = protocol.deployment;
        let deployment = { ...deployments[deploymentName] };

        let issuesArrays = { ...deployment.poolErrors };

        data.forEach((instance) => {
            const buildIssue = (value) => instance.id;
            let currentIssueField = "totalValueLockedUSD";
            if (
                !(
                    parseFloat(instance[currentIssueField]) > 1000 &&
                    parseFloat(instance[currentIssueField]) < 100000000000
                ) && !issuesArrays[currentIssueField]?.includes(instance.id)
            ) {
                issuesArrays[currentIssueField].push(buildIssue(parseFloat(instance[currentIssueField]).toFixed(2)));
            }

            currentIssueField = "cumulativeSupplySideRevenueUSD";
            if (
                !(
                    parseFloat(instance[currentIssueField]) >= 100 &&
                    parseFloat(instance[currentIssueField]) <= 10000000000
                ) && !issuesArrays[currentIssueField]?.includes(instance.id)
            ) {
                issuesArrays[currentIssueField].push(buildIssue(parseFloat(instance[currentIssueField]).toFixed(2)));
            }

            currentIssueField = "cumulativeProtocolSideRevenueUSD";
            if (
                !(
                    parseFloat(instance[currentIssueField]) >= 100 &&
                    parseFloat(instance[currentIssueField]) <= 10000000000
                ) && !issuesArrays[currentIssueField]?.includes(instance.id)
            ) {
                issuesArrays[currentIssueField].push(buildIssue(parseFloat(instance[currentIssueField]).toFixed(2)));
            }

            currentIssueField = "cumulativeVolumeUSD";

            if (!(parseFloat(instance[currentIssueField]) > 100 && parseFloat(instance[currentIssueField]) < 10000000000)) {
                issuesArrays[currentIssueField].push(buildIssue(parseFloat(instance[currentIssueField])));
            }

            currentIssueField = "outputTokenSupply";
            if (!(parseFloat(instance[currentIssueField]) >= 0) && !issuesArrays[currentIssueField]?.includes(instance.id)) {
                issuesArrays[currentIssueField].push(buildIssue(instance[currentIssueField]));
            }

            currentIssueField = "outputTokenPriceUSD";
            if (
                !(
                    parseFloat(instance[currentIssueField]) >= 0 &&
                    parseFloat(instance[currentIssueField]) <= 100000
                ) && !issuesArrays[currentIssueField]?.includes(instance.id)
            ) {
                issuesArrays[currentIssueField].push(buildIssue(instance[currentIssueField]));
            }

        })

        deployments[deploymentName].poolErrors = issuesArrays;

        if (!protocol?.liquidityPoolHourlySnapshots) return;
        data = protocol.liquidityPoolHourlySnapshots;
        if (!data?.length) return;
        url = protocol.url;
        // dataFields = Object.keys(data)

        deploymentName = protocol.deployment;
        deployment = { ...deployments[deploymentName] };

        issuesArrays = { ...deployment.poolErrors };

        data.forEach((instance) => {
            const buildIssue = (value) => instance.id;
            let currentIssueField = "totalValueLockedUSD";
            if (
                !(
                    parseFloat(instance[currentIssueField]) > 1000 &&
                    parseFloat(instance[currentIssueField]) < 100000000000
                ) && !issuesArrays[currentIssueField]?.includes(instance.id)
            ) {
                issuesArrays[currentIssueField].push(buildIssue(parseFloat(instance[currentIssueField]).toFixed(2)));
            }

            currentIssueField = "cumulativeSupplySideRevenueUSD";
            if (
                !(
                    parseFloat(instance[currentIssueField]) >= 100 &&
                    parseFloat(instance[currentIssueField]) <= 10000000000
                ) && !issuesArrays[currentIssueField]?.includes(instance.id)
            ) {
                issuesArrays[currentIssueField].push(buildIssue(parseFloat(instance[currentIssueField]).toFixed(2)));
            }

            currentIssueField = "cumulativeProtocolSideRevenueUSD";
            if (
                !(
                    parseFloat(instance[currentIssueField]) >= 100 &&
                    parseFloat(instance[currentIssueField]) <= 10000000000
                ) && !issuesArrays[currentIssueField]?.includes(instance.id)
            ) {
                issuesArrays[currentIssueField].push(buildIssue(parseFloat(instance[currentIssueField]).toFixed(2)));
            }

            currentIssueField = "cumulativeVolumeUSD";

            if (!(parseFloat(instance[currentIssueField]) > 100 && parseFloat(instance[currentIssueField]) < 10000000000)) {
                issuesArrays[currentIssueField].push(buildIssue(parseFloat(instance[currentIssueField])));
            }

            currentIssueField = "outputTokenSupply";
            if (!(parseFloat(instance[currentIssueField]) >= 0) && !issuesArrays[currentIssueField]?.includes(instance.id)) {
                issuesArrays[currentIssueField].push(buildIssue(instance[currentIssueField]));
            }

            currentIssueField = "outputTokenPriceUSD";
            if (
                !(
                    parseFloat(instance[currentIssueField]) >= 0 &&
                    parseFloat(instance[currentIssueField]) <= 100000
                ) && !issuesArrays[currentIssueField]?.includes(instance.id)
            ) {
                issuesArrays[currentIssueField].push(buildIssue(instance[currentIssueField]));
            }

        })

        deployments[deploymentName].poolErrors = issuesArrays;
    });

    const depoHolder = {};
    Object.keys(deployments).forEach((x) => {
        depoHolder[x] = { ...deployments[x] };
        const key = depoHolder[x].poolErrors;
        if (!key) return;
        Object.keys(key).forEach((y) => {
            if (key[y].length !== 0) {
                depoHolder[x].poolErrors[y] = key[y];
            }
        });
    });
    return depoHolder;
}
