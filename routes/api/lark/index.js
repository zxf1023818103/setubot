const express = require('express');
const router = new express.Router();
const crypto = require('crypto');
const axios = require('axios');

const app_id = process.env.LARK_APP_ID;
const app_secret = process.env.LARK_APP_SECRET;
const encrypt_key = process.env.LARK_ENCRYPT_KEY;
const verification_token = process.env.LARK_VERIFICATION_TOKEN;

const key = crypto.createHash('sha256').update(Buffer.from(encrypt_key, 'utf8')).digest();

function decrypt(base64) {
    const decode = Buffer.from(base64, 'base64');
    const iv = decode.slice(0, 16);
    const data = decode.slice(16, decode.length);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(data);
    decrypted += decipher.final('utf8');
    return decrypted.toString();
}

let app_access_token = null;
let tenant_access_token = null;
let app_access_token_expire_at = 0;
let tenant_access_token_expire_at = 0;

async function get_access_token(app_or_tenant) {
    let now = Date.now();
    let expired = app_or_tenant === 'app' ? app_access_token_expire_at <= now  : tenant_access_token_expire_at <= now;
    let access_token = app_or_tenant === 'app' ? app_access_token : tenant_access_token;
    if (expired) {
        let data = (await axios.post('https://open.feishu.cn/open-apis/auth/v3/' + app_or_tenant + '_access_token/internal/', {
            app_id: app_id,
            app_secret: app_secret
        }))['data'];
        if (data['code'] !== 0) {
            throw new Error(data);
        } else {
            access_token = data[app_or_tenant + '_access_token'];
            let expire = data['expire'];
            if (app_or_tenant === 'app') {
                app_access_token = access_token;
                app_access_token_expire_at = expire * 1000 + now - 1000;
            } else {
                tenant_access_token = access_token;
                tenant_access_token_expire_at = expire * 1000 + now - 1000;
            }
        }
    }
    return access_token;
}

async function send_message(option) {
    let data = (await axios.post('https://open.feishu.cn/open-apis/message/v4/send/', option, {
        headers: {
            'Authorization': 'Bearer ' + await get_access_token('tenant')
        }
    }))['data'];
    if (data['code'] === 0) {
        return data['message_id'];
    }
    else {
        throw new Error(data);
    }
}

async function upload_image(image, message_or_avatar) {
    let form = new FormData();
    form.append('image', image);
    form.append('image-type', message_or_avatar);
    let data = (await axios.post('https://open.feishu.cn/open-apis/image/v4/put/', form, {
        headers: {
            'Authorization': 'Bearer ' + await get_access_token('tenant')
        }
    }))['data'];
    if (data['code'] === 0) {
        return data['data']['image_key'];
    }
    else {
        throw new Error(data);
    }
}

async function get_user_access_token(code, grant_type) {
    let data = (await axios.post('https://open.feishu.cn/open-apis/authen/v1/access_token', {
        app_access_token: await get_access_token('app'),
        code: code,
        grant_type: grant_type === null ? 'authorization_code' : grant_type
    }))['data'];
    if (data['code'] === 0) {
        return data['data'];
    }
    else {
        throw new Error(data);
    }
}

async function refresh_user_access_token(refresh_token, grant_type) {
    let data = (await axios.post('https://open.feishu.cn/open-apis/authen/v1/refresh_access_token', {
        app_access_token: await  get_access_token('app'),
        grant_type: grant_type === null ? 'refresh_token' : grant_type,
        refresh_token: refresh_token
    }))['data'];
    if (data['code'] === 0) {
        return data['data'];
    }
    else {
        throw new Error(data);
    }
}

async function get_user_info(user_access_token) {
    let data = (await axios.post('https://open.feishu.cn/open-apis/authen/v1/user_info', {
        user_access_token: user_access_token
    }))['data'];
    if (data['code'] === 0) {
        return data['data'];
    }
    else {
        throw new Error(data);
    }
}

router.post('/event', async function (request, response) {
    let body = request.body;
    const encrypt = body.encrypt;
    if (encrypt !== undefined) {
        body = JSON.parse(decrypt(encrypt));
        //console.log(body);
    }
    if (body.token === verification_token) {
        if (body.challenge !== undefined) {
            response.json({
                'challenge': body.challenge
            }).status(200).end();
        } else {
            if (body['type'] === 'event_callback') {
                let event = body['event'];
                switch (event['type']) {
                    case 'message': {
                        let text_without_at_bot = event['text_without_at_bot'];
                        let response = await send_message({
                            chat_id: event['open_chat_id'],
                            root_id: event['open_message_id'],
                            msg_type: 'text',
                            content: {
                                text: '巧克力好吃吗'
                            }
                        });
                    }
                }
            }
        }
    }
});

module.exports = router;
