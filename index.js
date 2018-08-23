"use strict"

const fetch = require("node-fetch")
const uuid = require("uuid/v4")
const maxDepth = parseInt(process.env.MAX_DEPTH)
const projectId = process.env.GCP_PROJECT
const functionRegion = process.env.FUNCTION_REGION
const functionName = process.env.FUNCTION_NAME

function postFunction(
  requestToken,
  counter,
  fcmKey,
  requestId,
  deviceTokens,
  notificationData
) {
  return new Promise(function(resolve, reject) {
    if (counter >= maxDepth) {
      console.error("too many nested call!")
      return Promise.resolve()
    }

    if (deviceTokens.length <= 0) {
      console.log("no token specified")
      return Promise.resolve()
    }

    if (deviceTokens.length === 1) {
      return fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        body: JSON.stringify({
          to: deviceTokens[0],
          notification: {
            body: notificationData.body,
            click_action: notificationData.click_action
          },
          priority: notificationData.priority,
          content_available: notificationData.content_available
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `key=${fcmKey}`
        }
      })
        .then(res => {
          console.log(
            `send push notification to ${deviceTokens[0]} : ${res.status} ${
              res.statusText
            }`
          )
          resolve()
        })
        .catch(err => {
          console.error(`error in device ${deviceTokens[0]} : ${err}`)
          resolve(err)
        })
    } else {
      return fetch(
        `https://${functionRegion}-${projectId}.cloudfunctions.net/${functionName}`,
        {
          method: "POST",
          body: JSON.stringify({
            counter: counter + 1,
            calledBy: requestId,
            deviceTokens: deviceTokens,
            requestToken: requestToken,
            notificationData: notificationData
          }),
          headers: { "Content-Type": "application/json" }
        }
      ).then(res => {
        resolve(res)
      })
    }
  })
}

exports.baramaki = (req, res) => {
  const fcmKey = process.env.FCM_KEY
  const requestToken = process.env.REQUEST_TOKEN
  const deviceTokens = req.body.deviceTokens || []
  const slicedDeviceTokens1 = deviceTokens.slice(0, deviceTokens.length / 2)
  const slicedDeviceTokens2 = deviceTokens.slice(deviceTokens.length / 2)
  const counter = parseInt(req.body.counter) || 0
  const requestId = uuid()
  const parentFunctionId = req.body.calledBy || ""
  const notificationData = req.body.notificationData

  if (requestToken !== req.body.requestToken) {
    console.error("invalid request token")
    res.status(403).send("invalid request token")
    return false
  }

  console.log(
    `${requestId} called function${
      parentFunctionId !== "" ? " called by " + parentFunctionId : ""
    }`
  )

  Promise.all([
    postFunction(
      requestToken,
      counter,
      fcmKey,
      requestId,
      slicedDeviceTokens1,
      notificationData
    ),
    postFunction(
      requestToken,
      counter,
      fcmKey,
      requestId,
      slicedDeviceTokens2,
      notificationData
    )
  ]).then(() => {
    console.log(`promise done : level ${counter}, id : ${requestId}`)
  })

  res.status(200).send(`${requestId} call done`)
}
