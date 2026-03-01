# S3 Bucket Policy Example for AWS Transcribe

To allow AWS Transcribe and your application to read/write audio and transcript files, add a policy like this to your S3 bucket (replace BUCKET_NAME and account info as needed):

```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::BUCKET_NAME",
        "arn:aws:s3:::BUCKET_NAME/*"
      ]
    }
  ]
}
```

- For production, restrict the `Principal` to your AWS account or IAM role.
- Make sure your IAM user/role also has these permissions.
- After updating, test with `aws s3 ls s3://BUCKET_NAME` and `aws s3 cp` commands.

# Debugging Tips

- Check the AWS console for bucket policy errors.
- Use the AWS Policy Simulator to verify permissions.
- Make sure the region in your config matches the bucket's region.

---

If you need a more restrictive policy or help applying this, let me know!
