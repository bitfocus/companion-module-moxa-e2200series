import { cmd } from './consts.js'

export function buildMsg (path, cmd, dios, param) {
	if (!Array.isArray(dios)) {
		
		if(!isNaN(dios)){
            let i = dios
            dios = []
            dios[0] = i
        } else {
            this.log('warn', `buildMsg was passed invalid params`)
            return undefined
        }
	}
	let msg = path
	for (let i = 0; i < dios.length; i++) {
		msg = msg !== path ? msg + '&' : msg
		msg += cmd + dios[i].toString(10).padStart(2, '0') + '=' + param
	}
	if (this.config.verbose){
        self.log('debug', `Message Built: ${msg}`)
    }
	return msg
}

export async function sendMsg (msg) {
    if (msg === undefined) { return undefined }
    try {
		const response = await this.axios.get(msg)
		this.logResponse(response)
        return true
	} catch (error) {
		this.logError(error)
        return undefined
	}
}

export async function queryOnConnect(){
	let msg = cmd.get.path
	msg += `${cmd.get.date}=?&${cmd.get.time}=?&${cmd.get.location}=?&${cmd.get.description}=?`
	msg += `&${cmd.get.firmware}=?&${cmd.get.model}=?&${cmd.get.serial}=?&${cmd.get.macAddr}=?&${cmd.get.ip}=?`
	await this.sendMsg(msg)
}