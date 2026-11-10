local rhumbsSessions = {}

for _, rhumbsKey in ipairs(redis.call('KEYS', 'session:*')) do
  local rhumbsUser = redis.call('HMGET', rhumbsKey, 'userId', 'login')

  table.insert(
    rhumbsSessions,
    rhumbsKey .. ' userId=' .. rhumbsUser[1] .. ' login=' .. rhumbsUser[2]
  )
end

return rhumbsSessions
