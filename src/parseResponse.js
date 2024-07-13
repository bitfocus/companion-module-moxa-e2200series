import { cmd, response } from './consts.js'

export function parseResponse(data) {
    let varList = []
    const resp = data.replaceAll(cmd.char.quote,'').split(cmd.char.sep)
    for (const element of resp) {
        const v = element.split(cmd.char.eq)
        if (v.length !== 2) {continue}
        let u = v[0].split(cmd.char._)
        if (u.length === 2) {
            u[1] = parseInt(u[1])
        }
        switch (u[0]){
            case response.get.date:
                varList['date'] = v[1]
                break
            case response.get.time:
                varList['time'] = v[1]
                break
            case response.get.ip:
                varList['IP'] = v[1]
                break
            case response.get.location:
                varList['location'] = v[1]
                break
            case response.get.description:
                varList['description'] = v[1]
                break
            case response.get.firmware:
                varList['firmware'] = v[1]
                break
            case response.get.model:
                varList['model'] = v[1]
                break
            case response.get.serial:
                varList['serial'] = v[1]
                break
            case response.get.macAddr:
                varList['macAddr'] = v[1]
                break
            case response.get.di.mode:
                this.moxa.di[u[1]].mode = parseInt(v[1])
                break
            case response.get.di.status:
                this.moxa.di[u[1]].status = !!(parseInt(v[1]))
                break
            case response.get.di.filter:
                varList[`filter_input_${u[1]}`] = parseInt(v[1]) / 2
                break
            case response.get.di.trigger:
                this.moxa.di[u[1]].trigger = parseInt(v[1])
                break
            case response.get.di.countStart:
                this.moxa.di[u[1]].cntStart = !!(parseInt(v[1]))
                break
            case response.get.di.count:
                varList[`count_input_${u[1]}`] = parseInt(v[1])
                break
            case response.get.do.mode:
                this.moxa.do[u[1]].mode = parseInt(v[1])
                break
            case response.get.do.status:
                this.moxa.do[u[1]].status = !!(parseInt(v[1]))
                break
            case response.get.do.lowWidth:
                varList[`lowWidth_output_${u[1]}`] = parseInt(v[1]) / 2
                break
            case response.get.do.highWidth:
                varList[`highWidth_output_${u[1]}`] = parseInt(v[1]) / 2
                break
            case response.get.do.pulseStart:
                this.moxa.do[u[1]].pulseStart = !!(parseInt(v[1]))
                break
            default:
                this.log('debug', `unexpected response: ${element}`)
        }
    }
    this.checkFeedbacks()
    this.setVariableValues(varList)
}