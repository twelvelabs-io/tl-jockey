import os
from typing import Dict, Optional, Tuple, Union
from dotenv import load_dotenv
import boto3
from botocore.config import Config
from io import BytesIO
import hashlib
import logging
import ffmpeg
import json

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

    async def upload_file(self, tl_key: str, file_name: str, index_id: str, file_path: str, upload_type: str) -> None:
        """
        Upload a file to the spaces

        :param file_name: the name of the file
        :param index_id: the index id of the user
        :param file_path: the full local file path of the file
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

        try:
            response = self.s3.upload_fileobj(
                BytesIO(file_data),
                Bucket=self._BUCKET,
                Key=f"{upload_type}/{hashed_id}/{index_id}/{file_name}",
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

    async def get_file_url(self, tl_key: str, index_id: str, file_name: str, upload_type: str) -> Tuple[Optional[str], Dict]:
        """
        Get a signed url of the file, it must already exist in the spaces

        :param tl_key: the hashed id of the user
        :param index_id: the index id of the user
        :param file_name: the name of the file
        :return: the url of the file and the metadata
        """

        hashed_id = self.generate_unique_id(tl_key)

        # Step 2: Generate a signed URL
        try:
            signed_url = self.s3.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": self._BUCKET,
                    "Key": f"{upload_type}/{hashed_id}/{index_id}/{file_name}",
                },
                ExpiresIn=3600,
            )
        except Exception as e:
            logging.error(f"Error generating signed URL: {e}")
            return None, {"error": f"Error generating signed URL: {str(e)}"}

        # Step 3: Extract metadata (clips_used) using ffmpeg-python
        # only combined clips have metadata we need to extract
        if upload_type == "combined_clips":
            try:
                probe = ffmpeg.probe(signed_url)
                format_metadata = probe.get("format", {}).get("tags", {})
                description = format_metadata.get("description", None)

                if description:
                    clips_used = json.loads(description)
                    return signed_url, clips_used
                else:
                    return signed_url, {"error": "No description metadata found."}
            except Exception as e:
                logging.error(f"Error extracting metadata: {e}")
                return signed_url, {"error": f"Error extracting metadata: {str(e)}"}

        return signed_url, {}

    def generate_unique_id(self, tl_key: str) -> str:
        """
        Generate a unique id for the user given their tl_key

        :return: the unique id
        """
        return hashlib.sha256(tl_key.encode()).hexdigest()[:16]

    async def check_clip_exists_in_spaces(self, tl_key: str, clip_filename: str, index_id: str, upload_type: str) -> bool:
        """
        Check if a clip exists in the spaces

        :param clip_filename: the clip_filename
        :param index_id: the index id of the user
        :return: True if the clip exists, False otherwise
        """
        hashed_id = self.generate_unique_id(tl_key)
        key = f"{upload_type}/{hashed_id}/{index_id}/{clip_filename}"

        try:
            # Attempt to retrieve the file metadata to confirm existence
            self.s3.head_object(Bucket=self._BUCKET, Key=key)
            logging.info(f"Clip {clip_filename} exists in space.")
            return True
        except self.s3.exceptions.ClientError:
            # Handle 404 and other client errors
            logging.info(f"Clip {clip_filename} does not exist in space.")
            return False
        except Exception as e:
            # Handle any other unexpected errors
            logging.error(f"Error checking clip existence: {e}")
            return False
