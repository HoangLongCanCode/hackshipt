# Replayable curl happy path

Run `npm run db:reset && npm run dev`, then (bash). Envelope is `{ok:true,data}` or `{ok:false,error:{code,message}}`.

```bash
B=localhost:3000/api; J='-H Content-Type:application/json'; C='-b /tmp/cj -c /tmp/cj'
curl -s $C $J -d '{"email":"demo@rpgbirmingham.app"}' $B/auth/login          # MeDTO, credits 40, sets ksr_session cookie
curl -s "$B/quests?category=animals"                                          # QuestDTO[] (Dog Day id → DOG)
curl -s $C -X POST $B/quests/$DOG/accept                                      # QuestDetailDTO, myStatus ACCEPTED
curl -s $C $J -d '{"lat":0,"lng":0}' $B/quests/$DOG/checkin                   # myStatus CHECKED_IN (DEMO_MODE skips GPS)
curl -s $C $J -d '{"code":"0000"}' $B/quests/$DOG/complete                    # 422 BAD_CODE
curl -s $C $J -d '{"code":"1111"}' $B/quests/$DOG/complete                    # CompleteResultDTO: earned {30,60,0}, levelUp true, badges first-steps+team-player, class keeper
curl -s $B/store                                                              # {sponsors:[{offers:[…]}]}
curl -s $C $J -d '{"offerId":"<offer id>"}' $B/store/redeem                   # RedemptionDTO {code:"RPGB-XXXXX", balance}
curl -s $C $J -d '{"causeId":"<cause id>","amount":10}' $B/donate             # {balance, cause}
curl -s $C $J -d '{"causeId":"<cause id>","amount":9999}' $B/donate           # 402 INSUFFICIENT_CREDITS
curl -s $C $B/ledger                                                          # newest first: DONATE, SPEND, EARN, BONUS
```

Verified on the real server: BAD_CODE, INSUFFICIENT_CREDITS, unauthenticated → 401, and the chain
(1414 → 1515 → 1616) paying `chainBonus: 60` with *Chain Breaker* on the final step.
