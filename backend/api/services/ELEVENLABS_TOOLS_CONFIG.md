# ElevenLabs Server Tools Configuration Guide

## Your Webhook URL

**Base URL**: `https://cost-wizard-traveller-concerning.trycloudflare.com`  
**Webhook Endpoint**: `https://cost-wizard-traveller-concerning.trycloudflare.com/api/elevenlabs/convai/webhook`

⚠️ **Note**: Cloudflare tunnel URLs change each time you restart. For production, use a permanent domain.

## Available Server Tools

Your backend provides 11 server tools. Configure each one in the ElevenLabs dashboard:

### 1. lookup_reservation
**Description**: Look up a flight reservation by confirmation code

**Parameters**:
- `confirmation_code` (required): The 6-character confirmation code (e.g., "DEMO123")

**Webhook URL**: `https://cost-wizard-traveller-concerning.trycloudflare.com/api/elevenlabs/convai/webhook`

**Example Request**:
```json
{
  "tool_name": "lookup_reservation",
  "parameters": {
    "confirmation_code": "DEMO123"
  }
}
```

### 2. change_flight
**Description**: Change an existing flight reservation to a new date

**Parameters**:
- `confirmation_code` (required): The confirmation code
- `new_date` (required): New date (e.g., "tomorrow", "January 26")
- `preferred_time` (optional): "morning", "afternoon", or "evening"
- `selected_flight_id` (optional): ID of selected flight option

**Webhook URL**: Same as above

### 3. create_booking
**Description**: Create a new flight booking

**Parameters**:
- `origin` (required): Origin city or airport code
- `destination` (required): Destination city or airport code
- `date` (required): Travel date
- `first_name` (optional): Passenger's first name
- `last_name` (optional): Passenger's last name
- `selected_flight_id` (optional): Selected flight option ID

### 4. get_flight_options
**Description**: Search for available flights between two cities

**Parameters**:
- `origin` (required): Origin city or airport code
- `destination` (required): Destination city or airport code
- `date` (optional): Travel date

### 5. get_reservation_status
**Description**: Check the status of an existing reservation

**Parameters**:
- `confirmation_code` (required): The confirmation code to check

### 6. get_directions
**Description**: Get directions to airport amenities (restrooms, food, water, charging, medical, info)

**Parameters**:
- `destination_type` (required): "restroom", "food", "water", "charging", "medical", or "info"
- `current_location` (optional): Passenger's current location (e.g., "Gate B20")
- `terminal` (optional): Terminal letter (A, B, C, D, E)

### 7. create_family_helper_link
**Description**: Create a helper link for family to track passenger location

**Parameters**:
- `confirmation_code` (required): The passenger's confirmation code

### 8. check_flight_delays
**Description**: Check if a flight has delays, cancellations, or schedule changes

**Parameters**:
- `confirmation_code` (optional): The confirmation code
- `flight_number` (optional): The flight number directly (e.g., "AA123")

### 9. get_gate_directions
**Description**: Get step-by-step directions to a specific gate at DFW airport

**Parameters**:
- `gate` (required): The gate number (e.g., "B22", "A15")
- `current_location` (optional): Where passenger currently is

### 10. request_wheelchair
**Description**: Request wheelchair assistance for a passenger

**Parameters**:
- `confirmation_code` (required): The passenger's confirmation code
- `pickup_location` (optional): Where to send wheelchair (e.g., "Gate B22")

### 11. add_bags
**Description**: Add checked bags to the passenger's reservation

**Parameters**:
- `confirmation_code` (required): The confirmation code
- `bag_count` (optional): Number of bags to add (default: 1)

## How to Configure in ElevenLabs Dashboard

1. **Go to**: https://elevenlabs.io/app/conversational-ai
2. **Select your agent** (or create a new one)
3. **Go to "Server Tools" or "Functions" section**
4. **For each tool**:
   - Click "Add Tool" or "Add Function"
   - Enter the tool name (e.g., `lookup_reservation`)
   - Set the webhook URL: `https://cost-wizard-traveller-concerning.trycloudflare.com/api/elevenlabs/convai/webhook`
   - Configure parameters as shown above
   - Save

## Alternative: Get Tool Definitions Programmatically

You can get the complete tool definitions (with schemas) from your backend:

**URL**: `https://cost-wizard-traveller-concerning.trycloudflare.com/api/elevenlabs/convai/tools`

This returns JSON with:
- Complete tool definitions with parameter schemas
- The webhook URL to use

## Testing Your Webhook

Test that your webhook is working:

```bash
curl -X POST https://cost-wizard-traveller-concerning.trycloudflare.com/api/elevenlabs/convai/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "lookup_reservation",
    "parameters": {
      "confirmation_code": "DEMO123"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "tool_name": "lookup_reservation",
  "result": {
    "success": true,
    "reservation": { ... }
  }
}
```

## Important Notes

1. **Cloudflare Tunnel**: Your URL will change when you restart the tunnel. For production:
   - Use a permanent domain (e.g., your Vultr server IP or domain)
   - Set up SSL/HTTPS
   - Update the webhook URL in ElevenLabs dashboard

2. **Authentication**: Your webhook currently doesn't require authentication. For production, consider adding:
   - API key validation
   - HMAC signature verification
   - IP whitelisting

3. **Tool Format**: ElevenLabs may use slightly different parameter formats. The handler supports:
   - `tool_name` or `name`
   - `parameters` or `args`
   - Nested `tool_call` object

## Current Status

✅ Backend webhook handler ready  
✅ 11 server tools implemented  
✅ Tool definitions endpoint available  
✅ Frontend integration ready  
⏳ Need to configure tools in ElevenLabs dashboard  
⏳ Need permanent webhook URL for production
