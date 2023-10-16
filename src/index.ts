import fetch from "node-fetch";
import { IBody, GoalResponse } from "./interfaces/goal.interface.js";
import { config } from "dotenv";
config();

const GOAL_URL = `${process.env.GOAL_URL}`;
const BASE_URL = `${process.env.BASE_URL}`;
const CANDIDATE_ID = `${process.env.CANDIDATE_ID}`;

async function fetchGoal(): Promise<GoalResponse> {
  const requestGoal = await fetch(GOAL_URL);
  const response = (await requestGoal.json()) as GoalResponse;
  return response;
}

/**
 * Makes a POST request to the specified URL with the given body and retries the request if it fails.
 * @param url - The URL to make the request to.
 * @param body - The body of the request.
 * @param maxRetries - The maximum number of times to retry the request if it fails. Defaults to 3.
 * @returns A Promise that resolves to the JSON response of the request.
 * @throws An error if the request fails after the maximum number of retries.
 */
async function fetchWithRetry(
  url: string,
  body: IBody,
  maxRetries: number = 3
): Promise<any> {
  let retryCount = 0;
  let response;
  let waitTime = 1000;

  do {
    try {
      response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 429 && retryCount < maxRetries) {
        console.log(
          `Too Many Requests: Retrying in ${waitTime / 1000} seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        waitTime *= 2;
        retryCount++;
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      break;
    } catch (error) {
      console.error(error);
      if (retryCount >= maxRetries) {
        throw new Error("Max retries reached. Request failed");
      }
      retryCount++;
    }
  } while (true);

  return await response.json();
}

async function performActions() {
  const { goal } = await fetchGoal();

  for (let i = 0; i < goal.length; i++) {
    for (let j = 0; j < goal[i].length; j++) {
      const body: IBody = {
        row: i,
        column: j,
        candidateId: CANDIDATE_ID,
      };

      let url = BASE_URL;

      const currentGoal = goal[i][j];
      if (currentGoal.includes("COMETH")) {
        const direction = currentGoal.split("_")[0];
        body.direction = direction.toLowerCase();
        url += "/comeths";
      } else if (currentGoal.includes("SOLOON")) {
        const color = currentGoal.split("_")[0];
        body.color = color.toLowerCase();
        url += "/soloons";
      } else if (currentGoal === "POLYANET") {
        url += "/polyanets";
      }

      if (currentGoal !== "SPACE") {
        console.log(url);
        console.log(body);

        try {
          const requestData = await fetchWithRetry(url, body);
          console.log(requestData);
        } catch (error) {
          console.error("Request Failed:", error);
        }
      }
    }
  }
}

performActions();
