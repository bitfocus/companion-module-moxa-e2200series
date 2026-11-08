## Moxa ioLogik E2200 Series Control

DIO Control for the Moxa ioLogik e2210, e2212, e2214, e2242, e2260 and e2262 using HTTP.

Requires Companion 5.1 or later.

### Configuration

- **Model**: Sets which DIs and DOs the actions, feedbacks and variables offer
- **Hostname**: Hostname or IP address of the ioLogik
- **Poll Rate**: Seconds between polls. Set to 0 to turn polling off
- **Poll Data**: What each poll asks for. The date and time are always polled
- **Verbose Logs**: Log every request and reply

On connecting, the module asks for every DI and DO setting and the device information. It asks again if the device stops answering and comes back.

### Actions

- **Get DI Count**
- **Set DI Count Start**
- **Get / Set DI Filter**
- **Get / Set DI Mode**
- **Get / Set DI Trigger**
- **Get / Set DO Mode**
- **Get / Set DO Pulse**
- **Get / Set DO Pulse Width**
- **Get / Set DO Status**

All set actions can be performed against multiple DIs/DOs at once. The pulse widths and the filter are in ms, and can be expressions.

### Feedbacks

- **DI Counter**
- **DI Mode**
- **DI Status**
- **DI Trigger**
- **DO Mode**
- **DO Pulse**
- **DO Status**

### Variables

- **DI Counter**
- **DI Filter**
- **DO Pulse Width High**
- **DO Pulse Width Low**
- **Date**
- **Description**
- **Firmware Version**
- **IP Address**
- **Location**
- **MAC Address**
- **Model**
- **Serial Number**
- **Time**
