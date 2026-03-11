/**
 * Generate starter sentences for the first 500 words using templates.
 * These are high-quality TOEIC business context fill-in-the-blank sentences.
 * Each word gets 2 sentences from different business domains.
 */
const fs = require('fs')
const path = require('path')

const wordBankPath = path.join(__dirname, '..', 'src', 'data', 'wordBank.json')
const outputPath = path.join(__dirname, '..', 'src', 'data', 'sentences.json')

const wordBank = JSON.parse(fs.readFileSync(wordBankPath, 'utf-8'))

const DOMAINS = ['HR', 'Finance', 'Marketing', 'Operations', 'Legal']

// Templates by POS - each has {blank} for the word position
// Verb templates
const verbTemplates = [
  { en: 'The project manager decided to (____) the current strategy, after reviewing the quarterly report.', zh: '專案經理在審閱季度報告後，決定(是什麼)目前的策略。', domain: 'Operations' },
  { en: 'The HR department needs to (____) the new policy, before the end of this fiscal year.', zh: '人資部門需要在本會計年度結束前，(是什麼)新的政策。', domain: 'HR' },
  { en: 'Our marketing team plans to (____) this approach, in order to increase brand awareness.', zh: '我們的行銷團隊計劃(是什麼)這個方法，以提升品牌知名度。', domain: 'Marketing' },
  { en: 'The finance director asked the team to (____) all pending transactions, before the audit begins.', zh: '財務總監要求團隊在稽核開始前，(是什麼)所有待處理的交易。', domain: 'Finance' },
  { en: 'The legal counsel advised the company to (____) the contract terms, to avoid potential disputes.', zh: '法律顧問建議公司(是什麼)合約條款，以避免潛在的爭議。', domain: 'Legal' },
  { en: 'The board of directors voted to (____) the proposed changes, after a lengthy discussion.', zh: '董事會在長時間的討論後，投票決定(是什麼)提議的變更。', domain: 'Operations' },
  { en: 'The CEO instructed all managers to (____) their department goals, within the next two weeks.', zh: '執行長指示所有經理在接下來兩週內，(是什麼)部門目標。', domain: 'Operations' },
  { en: 'The sales representative was able to (____) the client\'s concerns, during the presentation.', zh: '業務代表在簡報期間，成功地(是什麼)了客戶的疑慮。', domain: 'Marketing' },
  { en: 'The accounting team must (____) all expense reports, before submitting them for approval.', zh: '會計團隊必須在提交核准前，(是什麼)所有的費用報告。', domain: 'Finance' },
  { en: 'The new regulations require companies to (____) their compliance procedures, on an annual basis.', zh: '新法規要求公司每年(是什麼)合規程序。', domain: 'Legal' },
]

// Noun templates
const nounTemplates = [
  { en: 'The company announced a new (____), which will take effect starting next month.', zh: '公司宣布了一項新的(是什麼)，將從下個月開始生效。', domain: 'Operations' },
  { en: 'According to the annual report, the (____) has increased significantly over the past year.', zh: '根據年度報告，(是什麼)在過去一年中大幅增加。', domain: 'Finance' },
  { en: 'The marketing department presented their (____) at the quarterly business review meeting.', zh: '行銷部門在季度業務檢討會議上，報告了他們的(是什麼)。', domain: 'Marketing' },
  { en: 'Every employee must review the updated (____), before signing the acknowledgment form.', zh: '每位員工在簽署確認表之前，都必須查看更新的(是什麼)。', domain: 'HR' },
  { en: 'The legal team prepared a detailed (____), for the upcoming merger negotiation.', zh: '法務團隊為即將到來的合併談判，準備了一份詳細的(是什麼)。', domain: 'Legal' },
  { en: 'The manager discussed the importance of (____), during the team\'s monthly meeting.', zh: '經理在團隊月會上，討論了(是什麼)的重要性。', domain: 'Operations' },
  { en: 'The board approved the proposed (____), after reviewing the consultant\'s recommendation.', zh: '董事會在審閱顧問的建議後，批准了提案的(是什麼)。', domain: 'Operations' },
  { en: 'Our clients have expressed their satisfaction with our (____), in the recent survey.', zh: '我們的客戶在最近的調查中，對我們的(是什麼)表示滿意。', domain: 'Marketing' },
  { en: 'The annual (____) will be distributed to all shareholders, by the end of this quarter.', zh: '年度(是什麼)將在本季末前，分發給所有股東。', domain: 'Finance' },
  { en: 'The HR director emphasized the need for better (____), in the workplace environment.', zh: '人資總監強調了工作環境中，需要更好的(是什麼)。', domain: 'HR' },
]

// Adjective templates
const adjTemplates = [
  { en: 'The consultant described the new system as highly (____), compared to the previous version.', zh: '顧問將新系統描述為與先前版本相比，非常(是什麼)的。', domain: 'Operations' },
  { en: 'The financial report revealed that the company\'s performance was (____), throughout the quarter.', zh: '財務報告顯示公司在整個季度中，表現是(是什麼)的。', domain: 'Finance' },
  { en: 'The marketing campaign was considered (____), by both the team and the client.', zh: '行銷活動被團隊和客戶認為是(是什麼)的。', domain: 'Marketing' },
  { en: 'The HR policy requires all applicants to be (____), in order to qualify for the position.', zh: '人資政策要求所有申請者必須是(是什麼)的，才有資格獲得該職位。', domain: 'HR' },
  { en: 'The legal contract was considered (____), after both parties reviewed all the terms.', zh: '在雙方審閱所有條款後，法律合約被認為是(是什麼)的。', domain: 'Legal' },
  { en: 'The board found the proposal to be (____), and approved it without further discussion.', zh: '董事會認為該提案是(是什麼)的，並無需進一步討論即予以批准。', domain: 'Operations' },
  { en: 'The survey results indicated that customer satisfaction levels remain (____), across all regions.', zh: '調查結果顯示，所有地區的客戶滿意度仍然是(是什麼)的。', domain: 'Marketing' },
  { en: 'The investment was deemed (____), by the financial advisory committee.', zh: '該投資被財務諮詢委員會認為是(是什麼)的。', domain: 'Finance' },
]

// Adverb templates
const adverbTemplates = [
  { en: 'The project was (____) completed ahead of schedule, thanks to the team\'s dedication.', zh: '由於團隊的奉獻，專案(是什麼)地提前完成。', domain: 'Operations' },
  { en: 'The new system (____) improved the efficiency of the entire department.', zh: '新系統(是什麼)地提升了整個部門的效率。', domain: 'Operations' },
  { en: 'The CEO (____) announced the company\'s expansion plans, at the annual conference.', zh: '執行長在年度大會上，(是什麼)地宣布了公司的擴張計劃。', domain: 'Marketing' },
  { en: 'The finance team (____) reviewed all the documents, before the deadline.', zh: '財務團隊在截止日期前，(是什麼)地審查了所有文件。', domain: 'Finance' },
]

function getTemplates(pos) {
  if (pos.includes('v')) return verbTemplates
  if (pos.includes('n')) return nounTemplates
  if (pos.includes('a')) return adjTemplates
  if (pos.includes('ad')) return adverbTemplates
  // Default to noun templates
  return nounTemplates
}

function generateSentences(word) {
  const templates = getTemplates(word.pos)
  // Pick 2 random templates from different domains
  const shuffled = [...templates].sort(() => Math.random() - 0.5)
  const selected = []
  const usedDomains = new Set()

  for (const t of shuffled) {
    if (selected.length >= 2) break
    if (usedDomains.has(t.domain) && shuffled.length > 2) continue
    usedDomains.add(t.domain)
    selected.push({
      en: t.en,
      zh: t.zh,
      domain: t.domain,
      answer: word.word
    })
  }

  return selected
}

function main() {
  // Take first 500 words
  const selectedWords = wordBank.slice(0, 500)

  const result = selectedWords.map(word => ({
    wordId: word.id,
    word: word.word,
    sentences: generateSentences(word)
  }))

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8')
  console.log(`Generated sentences for ${result.length} words`)
  console.log(`Total sentences: ${result.reduce((sum, w) => sum + w.sentences.length, 0)}`)

  // Sample output
  console.log('\nSample:')
  const sample = result[0]
  console.log(`${sample.word}:`)
  sample.sentences.forEach((s, i) => {
    console.log(`  ${i + 1}. [${s.domain}] ${s.en.slice(0, 80)}...`)
  })
}

main()
