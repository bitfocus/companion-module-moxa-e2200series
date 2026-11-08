# companion-module-moxa-e2200series

See [HELP.md](./companion/HELP.md) and [LICENSE](./LICENSE)

## Version History

### Version 2.0.0

- `companion/module-base` updated to `2.2.2`
- Minimum supported companion version `5.1`
- Support expressions. Pulse widths and the DI filter are number fields
- Convert to Typescript
- Use Node 26
- Ask for every DI and DO setting on connecting, as feedbacks no longer ask for their own
- Ask for everything again once an unreachable device answers
- Pass the action's abort signal to the message queue, so Companion can drop a request no longer wanted
- Check only the feedbacks whose state changed, rather than all of them on every reply
- Log a repeated error once, then at debug level
- Fix: DI Trigger feedback compared the DI mode, not its trigger
- Fix: Date & time poll sent `&&`
- Fix: A value holding `=`, such as a location, was dropped
- Fix: A reply for a channel the model doesn't have threw, dropping the rest of the reply
- Fix: An action with no valid DIs/DOs sent a request with no parameters
- Fix: Model and Poll Data config fields took the full width
