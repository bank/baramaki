# baramaki

baramaki is a script to send push notification to mobile devices
from Firebase Cloud Messaging by Google Cloud Functions.

## how to use
### environment variables requirement

| name | description |
| -- | -- |
| `FCM_KEY` | secret key of Firebase Cloud Messaging |
| `MAX_DEPTH` | preventing too many recursive function calls |
| `REQUEST_TOKEN` | a token for preventing execution from the outside |

see `.env.sample.yml`

### deployment
```shell
$ gcloud beta functions deploy baramaki \
          --trigger-http \
          --runtime nodejs8 \
          --region asia-northeast1 \
          --env-vars-file .env.yml
```

see also https://cloud.google.com/functions/docs/deploying/

### call function
```shell
$ cat sample.json
{
  "requestToken": "dummy-token",
  "deviceTokens": [
    "tokentokentokentoken",
  ],
  "notificationData": {
    "body": "test",
    "click_action": null,
    "data": "test data",
    "priority": "high",
    "content_available": true
  }
}
$ curl -X POST -H "Content-Type:application/json" --data @sample.json https://url-to-cloudfunctions.net/function
74609b53-947b-4b11-b287-96ae89cd5598 call done
```

## License

The program is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
