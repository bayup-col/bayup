# backend/s3_service.py
import boto3
from botocore.exceptions import ClientError
import os
import uuid

S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

def get_s3_client():
    return boto3.client(
        "s3", 
        region_name=AWS_REGION,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "testing"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "testing"),
        aws_session_token=os.getenv("AWS_SESSION_TOKEN", "testing"),
    )

def create_presigned_upload_url(file_type: str) -> dict | None:
    """
    Generate a presigned URL to upload a file to S3.
    """
    s3_client = get_s3_client()
    bucket_name = os.getenv("S3_BUCKET_NAME")
    if not bucket_name:
        # In a real app, you'd log this error.
        print("Error: S3_BUCKET_NAME environment variable not set.")
        return None

    # Generate a unique object name
    object_name = f"uploads/{uuid.uuid4()}.{file_type.split('/')[-1]}"

    try:
        response = s3_client.generate_presigned_post(
            Bucket=bucket_name,
            Key=object_name,
            Fields={"Content-Type": file_type},
            Conditions=[{"Content-Type": file_type}],
            ExpiresIn=3600  # URL expires in 1 hour
        )
        # The response contains the presigned URL and the fields needed for the POST request
        return response
    except ClientError as e:
        print(f"Error generating presigned URL: {e}")
        return None
