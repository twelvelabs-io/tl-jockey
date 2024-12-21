import os
from dotenv import load_dotenv
import boto3
from botocore.config import Config
from io import BytesIO
import hashlib
import logging

# Add logging configuration
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


class Spaces:
    _BUCKET = "jockey-test-capybara"
    _ENDPOINT_URL = "https://sfo3.digitaloceanspaces.com"

    def __init__(self):
        load_dotenv()

        self.access_key = os.environ.get("DO_MASTER_ID")
        self.secret_key = os.environ.get("DO_MASTER")

        if not self.access_key or not self.secret_key:
            raise ValueError("Required environment variables DO_MASTER_ID and DO_MASTER are not set")

        # create the s3 client
        self.s3 = boto3.client(
            "s3",
            region_name="sfo3",
            endpoint_url=self._ENDPOINT_URL,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            config=Config(signature_version="s3v4"),
        )

    async def upload_file(self, tl_key: str, file_name: str, index_id: str, file_path: str) -> None:
        """
        Upload a file to the spaces

        :param file_name: the name of the file
        :param index_id: the index id of the user
        :param file_path: the full file path of the file
        """
        logging.info(f"Uploading file {file_path} to spaces")

        file_data = None
        hashed_id = self.generate_unique_id(tl_key)

        try:
            with open(file_path, "rb") as data:
                file_data = data.read()
        except FileNotFoundError:
            print("Error: File not found")
            return
        except IOError as e:
            print(f"Error opening file: {e}")
            return

        if not file_data:
            return

        logging.info(f"Uploading file {file_path} to spaces")
        logging.info(f"hashed_id: {hashed_id}")
        logging.info(f"index_id: {index_id}")
        logging.info(f"file_name: {file_name}")

        try:
            response = self.s3.upload_fileobj(
                BytesIO(file_data),
                Bucket=self._BUCKET,
                Key=f"{hashed_id}/{index_id}/{file_name}",
                ExtraArgs={
                    "ContentType": "video/mp4",
                    "ContentDisposition": "inline",
                    "ACL": "private",  # must be private
                },
            )
            if not response:
                logging.info("File uploaded successfully")
        except boto3.exceptions.S3UploadFailedError as e:
            print(f"Error uploading to S3: {e}")
        except Exception as e:
            print(f"Unexpected error during upload: {e}")

    async def get_file_url(self, tl_key: str, index_id: str, file_name: str) -> str:
        """
        Get the url of the file, it must already exist in the spaces

        :param tl_key: the hashed id of the user
        :param index_id: the index id of the user
        :param file_name: the name of the file
        :return: the url of the file
        """

        hashed_id = self.generate_unique_id(tl_key)

        # Check if file exists - handle 404 exception
        try:
            self.s3.head_object(Bucket=self._BUCKET, Key=f"{hashed_id}/{index_id}/{file_name}")
        except self.s3.exceptions.ClientError as e:
            if e.response["Error"]["Code"] == "404":
                logging.info(f"File {file_name} not found in space")
                return None
            else:
                logging.error(f"Error checking file existence: {e}")
                return None

        try:
            url = self.s3.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": self._BUCKET,
                    "Key": f"{hashed_id}/{index_id}/{file_name}",
                },
                ExpiresIn=3600,
            )
        except Exception as e:
            print(f"Error getting url: {e}")
            return None

        return url

    def generate_unique_id(self, tl_key: str) -> str:
        """
        Generate a unique id for the user

        :return: the unique id
        """
        return hashlib.sha256(tl_key.encode()).hexdigest()[:16]

    async def check_clip_exists_in_spaces(self, tl_key: str, clip_filename: str, index_id: str) -> bool:
        """
        Check if a clip exists in the spaces

        :param clip_filename: the clip_filename
        :param index_id: the index id of the user
        :return: True if the clip exists, False otherwise
        """
        hashed_id = self.generate_unique_id(tl_key)
        key = f"{hashed_id}/{index_id}/{clip_filename}"

        try:
            # Attempt to retrieve the file metadata to confirm existence
            self.s3.head_object(Bucket=self._BUCKET, Key=key)
            logging.info(f"Clip {clip_filename} exists in space.")
            return True
        except:
            # Any error (including 404 or other exceptions) will return False
            logging.info(f"Clip {clip_filename} does not exist in space.")
            return False
