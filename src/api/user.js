

import request from './request';





export function getUserInfo() {

  return request({

    url: '/user/info',

    method: 'get'

  });

}





export function getIpLocationInfo() {

  return request({

    url: 'https://ipwho.is/',

    method: 'get',

    baseURL: '' 
  });

}





// 签到相关API
export function checkin(data) {
  return request({
    url: '/user/checkin',
    method: 'post',
    data
  });
}

export function standardCheckin() {
  return checkin({ type: 1 });
}

export function luckyCheckin(input) {
  return checkin({ type: 2, input });
}

export function redeemGiftCard(giftcard) {

  return request({

    url: '/user/redeemgiftcard',

    method: 'post',

    data: { giftcard }

  });

}





export function changePassword(data) {

  return request({

    url: '/user/changePassword',

    method: 'post',

    data

  });

}





export function resetSecurity() {

  return request({

    url: '/user/resetSecurity',

    method: 'get'

  });

}





export function updateRemindSettings(data) {

  return request({

    url: '/user/update',

    method: 'post',

    data

  });

}





export function getActiveSession() {

  return request({

    url: '/user/getActiveSession',

    method: 'get'

  });

}





export function getCommConfig() {

  return request({

    url: '/user/comm/config',

    method: 'get'

  });

}





export function getTelegramBotInfo() {

  return request({

    url: '/user/telegram/getBotInfo',

    method: 'get'

  });

}





export function getUserSubscribe() {

  return request({

    url: '/user/getSubscribe',

    method: 'get'

  });

} 
