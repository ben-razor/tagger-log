const functions = require('firebase-functions');
const firestore = require('@google-cloud/firestore')
const client = new firestore.v1.FirestoreAdminClient()

/** 
exports.helloWorld = functions.https.onRequest((request, response) => { 
    functions.logger.info("Hello logs!", {structuredData: true});
    response.send("Hello from Firebase!");
});
*/

function backupFirestore() {
  const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT
  const databaseName = client.databasePath(projectId, '(default)')
  
  return client
    .exportDocuments({
      name: databaseName,
      outputUriPrefix: 'gs://taggerlog-backup-2',
      // Empty array == all collections
      collectionIds: []
    })
    .then(([response]) => {
      console.log(`Operation Name: ${response.name}`)
      return response
    })
    .catch(err => {
      console.error(err)
      throw new Error('Export operation failed')
    })
}

// Schedule the automated backup
exports.backupFirestore = functions.region('europe-west2')
    .pubsub.schedule('every 24 hours')
    .onRun(backupFirestore);
