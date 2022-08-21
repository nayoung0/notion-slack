const { Client } = require("@notionhq/client")
const { IncomingWebhook } = require('@slack/webhook')

const NOTION_SECRET_KEY = process.env.NOTION_SECRET_KEY
const NOTION_DATABASE_ID = process.env.NOTION_EXAMPLE_DATABASE_ID


const SLACK_URL = process.env.SLACK_URL

const notion = new Client({
  auth: NOTION_SECRET_KEY
})

const webhook = new IncomingWebhook(SLACK_URL)

Date.prototype.toYYYYMMDD = function () {
  const date = new Date(this.valueOf())
  let YYYY = date.getFullYear()
  let MM = date.getMonth() + 1
  let DD = date.getDate()
  let _MM = MM >= 10 ? `${MM}` : `0${MM}`
  let _DD = DD >= 10 ? `${DD}` : `0${DD}`
  return `${YYYY}-${_MM}-${_DD}`
}

const getCompletedTILer = async () => {
  const today = new Date().toYYYYMMDD()
  const response = await notion.databases.query({
    database_id: NOTION_DATABASE_ID,
    filter: {
      property: "생성일",
      created_time: {
        on_or_after: today,
      },
    },
  })

  const nameList = await Promise.all(response.results.map(async (result) => {
    const user_id = result.created_by.id
    const userData = await notion.users.retrieve({user_id})
    return userData.name
  }))

  return nameList
}


const sendSlackMessage = async (nameList) => {
  await webhook.send(`오늘 TIL 은 총 ${nameList.length} 명이 등록했습니다: ${nameList.join(", ")}`)
}


exports.handler = async (event) => {
    const nameList = await getCompletedTILer()
    await sendSlackMessage(nameList)
};
