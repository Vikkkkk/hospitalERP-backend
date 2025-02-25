# 📤 WeCom Integration Setup

This module allows sending procurement approval requests and notifications using the WeCom (企业微信) API.

## ⚙️ Configuration Steps:

1. **Get API Credentials**:
   - Go to the WeCom developer portal.
   - Obtain:
     - **Corp ID (corpid)**
     - **Agent ID (agentid)**
     - **Secret**

2. **Set Up Environment Variables**:
   - Add the following variables to your `.env` file:
     ```
     WECOM_CORP_ID=your-corp-id
     WECOM_AGENT_ID=your-agent-id
     WECOM_SECRET=your-secret
     WECOM_CALLBACK_URL=https://your-ngrok-url/wecom/callback
     ```

3. **Ngrok for Local Testing**:
   - Run the following command:
     ```
     ngrok http 5080
     ```
   - Update the `WECOM_CALLBACK_URL` with the generated Ngrok URL.

4. **Endpoints**:
   - `POST /wecom/callback` → Handles approval/rejection callbacks.

5. **Send Approval Requests**:
   - Automatically triggered by procurement submission events.

