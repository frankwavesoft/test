const { BlobServiceClient } = require("@azure/storage-blob");
require("dotenv").config();

const log = require("./log");
const functions = require("./functions");
const fileHelper = require("./file-helper");

class Storage {
  init = async () => {
    try {
      const connectionString = `DefaultEndpointsProtocol=https;AccountName=${process.env.AZURE_STORAGE_ACCOUNT_NAME};AccountKey=${process.env.AZURE_STORAGE_ACCOUNT_KEY};EndpointSuffix=core.windows.net`;
      const blobServiceClient =
        BlobServiceClient.fromConnectionString(connectionString);

      this.circleContainer = blobServiceClient.getContainerClient("circle");
      this.circlePhotoContainer =
        blobServiceClient.getContainerClient("circle-photo");
      this.circleRecurringContainer =
        blobServiceClient.getContainerClient("circle-recurring");
      this.eventContainer = blobServiceClient.getContainerClient("event");
      this.organizationContainer =
        blobServiceClient.getContainerClient("organization");
      this.organizerContainer =
        blobServiceClient.getContainerClient("organizer");
      this.userContainer = blobServiceClient.getContainerClient("user");

      this.isSupportStorage = process.env.IS_SUPPORT_STORAGE === "true";
      //   for await (const blob of this.userContainer.listBlobsFlat()) {
      //     // Get Blob Client from name, to get the URL
      //     const tempBlockBlobClient = this.userContainer.getBlockBlobClient(
      //       blob.name
      //     );

      //     // Display blob name and URL
      //     console.log(
      //       `\n\tname: ${blob.name}\n\tURL: ${tempBlockBlobClient.url}\n`
      //     );
      //   }
      log.trace(`Storage init ${this.isSupportStorage} ---- finished`);
    } catch (error) {
      log.error(`Storage init ---- ${error.message}`);
    }
  };

  uploadFile = async (
    containerClient,
    filePath,
    blobName,
    willDeleteFile = true
  ) => {
    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.uploadFile(filePath);
      // `Blob was uploaded successfully. requestId: ${uploadBlobResponse.requestId}`
      if (willDeleteFile) {
        fileHelper.deleteFile(filePath);
      }
      return blockBlobClient.url;
    } catch (error) {
      log.error(`Storage uploadFile ---- ${error.message}`);
    }
  };

  deleteFile = async (containerClient, fullBlobName) => {
    try {
      if (functions.isEmpty(fullBlobName)) {
        return;
      }
      const blobNameArray = fullBlobName.split("/");
      if (functions.hasValue(blobNameArray) && blobNameArray.length > 0) {
        const blobName = blobNameArray[blobNameArray.length - 1];
        const options = {
          deleteSnapshots: "include", // or 'only'
        };
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.delete(options);
      }
    } catch (error) {
      log.error(`Storage deleteFile ---- ${error.message}`);
    }
  };

  copyStorageFile = async (
    sourceContainerClient,
    destinationContainerClient,
    sourceFullBlobName,
    destinationBlobName
  ) => {
    try {
      if (functions.isEmpty(sourceFullBlobName)) {
        return;
      }
      const sourceBlobNameArray = sourceFullBlobName.split("/");
      if (
        functions.hasValue(sourceBlobNameArray) &&
        sourceBlobNameArray.length > 0
      ) {
        const sourceBlobName =
          sourceBlobNameArray[sourceBlobNameArray.length - 1];
        const sourceBlob = sourceContainerClient.getBlobClient(sourceBlobName);
        const destinationBlob =
          destinationContainerClient.getBlobClient(destinationBlobName);

        const response = await destinationBlob.beginCopyFromURL(sourceBlob.url);
        await response.pollUntilDone();
        return destinationBlob.url;
      }
    } catch (error) {
      log.error(`Storage copyStorageFile ---- ${error.message}`);
    }
  };
}

const storage = new Storage();
storage.init();

module.exports = storage;
