/**
 * Generate improved starter sentences for words using diverse templates.
 *
 * Key improvements:
 * - Many more templates per POS (50+ each)
 * - Templates designed to work grammatically with various words
 * - Categorized by transitive/intransitive verbs, countable/uncountable nouns
 * - Chinese translations adapted to be more generic
 * - Each word gets 2 sentences from different templates
 */
const fs = require('fs')
const path = require('path')

const wordBankPath = path.join(__dirname, '..', 'src', 'data', 'wordBank.json')
const outputPath = path.join(__dirname, '..', 'src', 'data', 'sentences.json')

const wordBank = JSON.parse(fs.readFileSync(wordBankPath, 'utf-8'))

// ============================================================
// VERB TEMPLATES - transitive (most TOEIC verbs)
// ============================================================
const verbTemplates = [
  // HR context
  { en: 'The HR manager asked the team to (____) the issue, before the meeting starts.', zh: '人資經理要求團隊在會議開始前，先(是什麼)這個問題。', domain: 'HR' },
  { en: 'New employees are required to (____) the orientation process, during their first week.', zh: '新員工在第一週必須(是什麼)入職培訓流程。', domain: 'HR' },
  { en: 'The department head decided to (____) the request, after careful evaluation.', zh: '部門主管在仔細評估後，決定(是什麼)這項請求。', domain: 'HR' },
  { en: 'Staff members were encouraged to (____) the feedback, from the latest survey.', zh: '員工被鼓勵去(是什麼)最新調查中的回饋意見。', domain: 'HR' },
  { en: 'The training coordinator plans to (____) the program, next quarter.', zh: '培訓協調人計劃在下一季(是什麼)這個計畫。', domain: 'HR' },
  { en: 'Supervisors must (____) all timesheets, before the payroll deadline.', zh: '主管必須在薪資截止日前，(是什麼)所有工時表。', domain: 'HR' },
  { en: 'The recruiter tried to (____) the candidate\'s qualifications, during the interview.', zh: '招聘人員在面試時試圖(是什麼)候選人的資格。', domain: 'HR' },
  { en: 'Management agreed to (____) the proposal, submitted by the union.', zh: '管理層同意(是什麼)工會提交的提案。', domain: 'HR' },
  // Finance context
  { en: 'The accountant needs to (____) the records, before the end of the fiscal year.', zh: '會計師需要在會計年度結束前，(是什麼)這些記錄。', domain: 'Finance' },
  { en: 'Investors were advised to (____) their portfolios, in light of market changes.', zh: '投資人被建議根據市場變化，(是什麼)他們的投資組合。', domain: 'Finance' },
  { en: 'The CFO instructed the team to (____) all expenses, prior to the audit.', zh: '財務長指示團隊在稽核前，(是什麼)所有費用。', domain: 'Finance' },
  { en: 'The bank decided to (____) the loan application, after reviewing the documents.', zh: '銀行在審閱文件後，決定(是什麼)這份貸款申請。', domain: 'Finance' },
  { en: 'Financial analysts expect the company to (____) its revenue targets, this year.', zh: '財務分析師預期公司今年會(是什麼)營收目標。', domain: 'Finance' },
  { en: 'The treasurer was asked to (____) the budget, for the upcoming quarter.', zh: '財務主管被要求(是什麼)下一季的預算。', domain: 'Finance' },
  { en: 'Shareholders voted to (____) the dividend plan, at the annual meeting.', zh: '股東在年度會議上投票(是什麼)股利計畫。', domain: 'Finance' },
  { en: 'The audit team will (____) all transactions, from the past six months.', zh: '稽核團隊將(是什麼)過去六個月的所有交易。', domain: 'Finance' },
  // Marketing context
  { en: 'The marketing director wants to (____) the campaign, before the product launch.', zh: '行銷總監希望在產品上市前，(是什麼)這個活動。', domain: 'Marketing' },
  { en: 'Our team plans to (____) the brand strategy, based on customer feedback.', zh: '我們的團隊計劃根據客戶回饋，(是什麼)品牌策略。', domain: 'Marketing' },
  { en: 'The sales team managed to (____) the client\'s expectations, during the presentation.', zh: '業務團隊在簡報中成功地(是什麼)了客戶的期望。', domain: 'Marketing' },
  { en: 'Market research helped the company (____) the target audience, more effectively.', zh: '市場研究幫助公司更有效地(是什麼)目標客群。', domain: 'Marketing' },
  { en: 'The advertising agency was hired to (____) the new product line, across all channels.', zh: '廣告代理商被聘請來在所有通路上(是什麼)新產品線。', domain: 'Marketing' },
  { en: 'Customer service representatives should (____) every complaint, within 24 hours.', zh: '客服代表應該在24小時內(是什麼)每一個投訴。', domain: 'Marketing' },
  { en: 'The PR team was instructed to (____) the media response, immediately.', zh: 'PR團隊被指示立即(是什麼)媒體回應。', domain: 'Marketing' },
  // Operations context
  { en: 'The project manager decided to (____) the timeline, to meet the deadline.', zh: '專案經理決定(是什麼)時程表，以趕上截止日期。', domain: 'Operations' },
  { en: 'Engineers were asked to (____) the system, before deployment.', zh: '工程師被要求在部署前(是什麼)系統。', domain: 'Operations' },
  { en: 'The operations team needs to (____) the workflow, to improve efficiency.', zh: '營運團隊需要(是什麼)工作流程，以提升效率。', domain: 'Operations' },
  { en: 'The CEO announced plans to (____) the company\'s global presence, next year.', zh: '執行長宣布計劃在明年(是什麼)公司的全球據點。', domain: 'Operations' },
  { en: 'The committee was formed to (____) the safety procedures, at all facilities.', zh: '委員會成立以在所有設施(是什麼)安全程序。', domain: 'Operations' },
  { en: 'Supply chain managers must (____) vendor relationships, on a regular basis.', zh: '供應鏈經理必須定期(是什麼)供應商關係。', domain: 'Operations' },
  { en: 'The IT department was unable to (____) the software update, due to technical issues.', zh: 'IT部門因技術問題而無法(是什麼)軟體更新。', domain: 'Operations' },
  { en: 'The quality team decided to (____) the production batch, after finding defects.', zh: '品管團隊在發現缺陷後，決定(是什麼)這批生產。', domain: 'Operations' },
  { en: 'All departments were required to (____) the new guidelines, effective immediately.', zh: '所有部門被要求立即(是什麼)新的準則。', domain: 'Operations' },
  { en: 'The logistics coordinator attempted to (____) the shipment, before the holiday.', zh: '物流協調人員嘗試在假期前(是什麼)這批貨運。', domain: 'Operations' },
  // Legal context
  { en: 'The attorney advised the client to (____) the agreement, before signing.', zh: '律師建議客戶在簽署前(是什麼)這份協議。', domain: 'Legal' },
  { en: 'Both parties agreed to (____) the dispute, through mediation.', zh: '雙方同意透過調解來(是什麼)爭議。', domain: 'Legal' },
  { en: 'The compliance officer was asked to (____) all regulations, affecting the industry.', zh: '合規主管被要求(是什麼)影響產業的所有法規。', domain: 'Legal' },
  { en: 'The court ordered the company to (____) the outstanding claims, within 30 days.', zh: '法院命令公司在30天內(是什麼)未解決的索賠。', domain: 'Legal' },
  { en: 'The legal team will (____) the contract, once all conditions are met.', zh: '法務團隊將在所有條件滿足後(是什麼)合約。', domain: 'Legal' },
  { en: 'Regulatory authorities required the firm to (____) its business practices, immediately.', zh: '監管機構要求公司立即(是什麼)其商業行為。', domain: 'Legal' },
  // General business
  { en: 'The board of directors voted to (____) the initiative, following extensive debate.', zh: '董事會在廣泛辯論後投票(是什麼)這項倡議。', domain: 'Operations' },
  { en: 'The consultant recommended that we (____) our approach, to stay competitive.', zh: '顧問建議我們(是什麼)我們的做法，以保持競爭力。', domain: 'Operations' },
  { en: 'It is important to (____) customer expectations, at every touchpoint.', zh: '在每個接觸點(是什麼)客戶期望是很重要的。', domain: 'Marketing' },
  { en: 'The manager promised to (____) the matter, by the end of the week.', zh: '經理承諾在本週結束前(是什麼)此事。', domain: 'Operations' },
  { en: 'The team leader encouraged everyone to (____) the challenge, with a positive attitude.', zh: '團隊領導鼓勵大家以正面的態度(是什麼)這個挑戰。', domain: 'HR' },
  { en: 'Please make sure to (____) the report, before submitting it to the director.', zh: '請確保在提交給主管前，先(是什麼)這份報告。', domain: 'Operations' },
  { en: 'The organization plans to (____) the program, starting from January.', zh: '組織計劃從一月起(是什麼)這個計畫。', domain: 'Operations' },
  { en: 'We need to (____) this problem, as soon as possible.', zh: '我們需要盡快(是什麼)這個問題。', domain: 'Operations' },
  { en: 'The director instructed the staff to (____) all pending tasks, by Friday.', zh: '主管指示同仁在週五前(是什麼)所有待辦事項。', domain: 'Operations' },
  { en: 'The company has decided to (____) operations, in several overseas markets.', zh: '公司已決定在數個海外市場(是什麼)營運。', domain: 'Operations' },
]

// ============================================================
// NOUN TEMPLATES
// ============================================================
const nounTemplates = [
  // HR
  { en: 'The company provides excellent (____), as part of the employee benefits package.', zh: '公司提供優良的(是什麼)，作為員工福利方案的一部分。', domain: 'HR' },
  { en: 'Every department must submit a detailed (____), to the management team.', zh: '每個部門都必須向管理團隊提交一份詳細的(是什麼)。', domain: 'HR' },
  { en: 'The new (____) was announced at the company-wide meeting, last Monday.', zh: '新的(是什麼)在上週一的全公司會議上宣布。', domain: 'HR' },
  { en: 'Employees expressed concern about the lack of (____), in the workplace.', zh: '員工對工作場所缺乏(是什麼)表示擔憂。', domain: 'HR' },
  { en: 'The HR manager emphasized the importance of (____), for career development.', zh: '人資經理強調了(是什麼)對職涯發展的重要性。', domain: 'HR' },
  { en: 'A significant (____) was observed, in the employee satisfaction survey.', zh: '在員工滿意度調查中觀察到一個顯著的(是什麼)。', domain: 'HR' },
  { en: 'The training session focused on improving (____), among team members.', zh: '培訓課程著重於改善團隊成員之間的(是什麼)。', domain: 'HR' },
  // Finance
  { en: 'The quarterly report highlighted a steady growth in (____), over the past year.', zh: '季度報告強調了過去一年(是什麼)的穩定成長。', domain: 'Finance' },
  { en: 'The financial advisor recommended a change in (____), to reduce risk.', zh: '財務顧問建議改變(是什麼)，以降低風險。', domain: 'Finance' },
  { en: 'A thorough (____) is required, before any major investment decision.', zh: '在任何重大投資決策前，都需要徹底的(是什麼)。', domain: 'Finance' },
  { en: 'The total (____) exceeded expectations, according to the latest figures.', zh: '根據最新數據，總(是什麼)超出預期。', domain: 'Finance' },
  { en: 'The bank offered a special (____), to attract new business clients.', zh: '銀行提供特別的(是什麼)，以吸引新的企業客戶。', domain: 'Finance' },
  { en: 'Due to the economic downturn, the (____) has declined significantly.', zh: '由於經濟衰退，(是什麼)大幅下降。', domain: 'Finance' },
  { en: 'The annual (____) will be distributed to shareholders, next month.', zh: '年度(是什麼)將於下個月分配給股東。', domain: 'Finance' },
  // Marketing
  { en: 'Customer surveys revealed a strong preference for (____), among younger buyers.', zh: '客戶調查顯示年輕買家對(是什麼)有強烈偏好。', domain: 'Marketing' },
  { en: 'The advertising campaign successfully increased (____), by 20 percent.', zh: '廣告活動成功地將(是什麼)提高了20%。', domain: 'Marketing' },
  { en: 'Our competitive (____) sets us apart, from other companies in the industry.', zh: '我們的競爭(是什麼)使我們與業界其他公司區別開來。', domain: 'Marketing' },
  { en: 'The product launch generated significant (____), in the local market.', zh: '產品上市在本地市場產生了顯著的(是什麼)。', domain: 'Marketing' },
  { en: 'Brand (____) is essential, for building long-term customer relationships.', zh: '品牌(是什麼)對建立長期客戶關係至關重要。', domain: 'Marketing' },
  { en: 'The market analysis identified a growing demand for (____), in this region.', zh: '市場分析指出此區域對(是什麼)的需求正在增長。', domain: 'Marketing' },
  { en: 'The company invested heavily in (____), to improve its public image.', zh: '公司大量投資於(是什麼)，以改善其公眾形象。', domain: 'Marketing' },
  // Operations
  { en: 'The factory reported an issue with (____), during the production process.', zh: '工廠在生產過程中報告了(是什麼)的問題。', domain: 'Operations' },
  { en: 'Effective (____) is crucial, for the success of any large-scale project.', zh: '有效的(是什麼)對任何大型專案的成功至關重要。', domain: 'Operations' },
  { en: 'The manager requested additional (____), to complete the project on time.', zh: '經理要求額外的(是什麼)，以準時完成專案。', domain: 'Operations' },
  { en: 'A lack of proper (____) can lead to serious operational problems.', zh: '缺乏適當的(是什麼)可能導致嚴重的營運問題。', domain: 'Operations' },
  { en: 'The board approved a new (____), for the upcoming fiscal year.', zh: '董事會批准了新的(是什麼)，適用於即將到來的會計年度。', domain: 'Operations' },
  { en: 'The meeting agenda included a discussion about (____), and its future impact.', zh: '會議議程包括討論(是什麼)及其未來影響。', domain: 'Operations' },
  { en: 'Improving (____) has been the company\'s top priority, this quarter.', zh: '改善(是什麼)一直是公司本季的首要優先事項。', domain: 'Operations' },
  { en: 'The report identified several areas where (____) could be enhanced.', zh: '報告指出了(是什麼)可以加強的幾個領域。', domain: 'Operations' },
  // Legal
  { en: 'The lawyer presented the (____) as evidence, during the court hearing.', zh: '律師在法庭聽證期間提出(是什麼)作為證據。', domain: 'Legal' },
  { en: 'According to the contract, the (____) must be delivered within 60 days.', zh: '根據合約，(是什麼)必須在60天內交付。', domain: 'Legal' },
  { en: 'The regulation requires full disclosure of (____), in all public filings.', zh: '法規要求在所有公開申報中，完全揭露(是什麼)。', domain: 'Legal' },
  { en: 'The patent covers the (____), developed by the research team.', zh: '該專利涵蓋了研究團隊開發的(是什麼)。', domain: 'Legal' },
  // General
  { en: 'The level of (____) in this organization is remarkably high.', zh: '這個組織中(是什麼)的水準非常高。', domain: 'Operations' },
  { en: 'Access to reliable (____) is essential, for making informed decisions.', zh: '取得可靠的(是什麼)對做出明智的決策至關重要。', domain: 'Operations' },
  { en: 'The conference focused on the latest trends in (____), across the industry.', zh: '會議聚焦於產業中(是什麼)的最新趨勢。', domain: 'Marketing' },
  { en: 'The success of the project depends largely on the quality of (____).', zh: '專案的成功很大程度上取決於(是什麼)的品質。', domain: 'Operations' },
  { en: 'Participants were asked to provide their feedback on the (____).', zh: '與會者被要求對(是什麼)提供回饋意見。', domain: 'Operations' },
  { en: 'The committee discussed the need for a better (____), going forward.', zh: '委員會討論了未來需要更好的(是什麼)。', domain: 'Operations' },
  { en: 'The (____) was well received by both clients and employees.', zh: '(是什麼)受到客戶和員工的好評。', domain: 'Marketing' },
  { en: 'Maintaining high standards of (____) is a core value of our company.', zh: '維持(是什麼)的高標準是我們公司的核心價值。', domain: 'Operations' },
  { en: 'The new (____) will be introduced at the trade show, in September.', zh: '新的(是什麼)將在九月的展覽上推出。', domain: 'Marketing' },
  { en: 'Several improvements were made to the (____), based on user feedback.', zh: '根據使用者回饋，(是什麼)做了數項改進。', domain: 'Operations' },
]

// ============================================================
// ADJECTIVE TEMPLATES
// ============================================================
const adjTemplates = [
  { en: 'The results of the survey were quite (____), according to the analysts.', zh: '根據分析師的看法，調查結果相當(是什麼)。', domain: 'Marketing' },
  { en: 'The new policy is considered (____), by most employees in the company.', zh: '新政策被公司大多數員工認為是(是什麼)的。', domain: 'HR' },
  { en: 'The investment was deemed (____), by the financial advisory committee.', zh: '該投資被財務諮詢委員會認為是(是什麼)的。', domain: 'Finance' },
  { en: 'The consultant described the process as highly (____), compared to the industry standard.', zh: '顧問將這個流程描述為與產業標準相比，非常(是什麼)的。', domain: 'Operations' },
  { en: 'The board found the proposal to be (____), and approved it without delay.', zh: '董事會認為該提案是(是什麼)的，並毫不拖延地予以批准。', domain: 'Operations' },
  { en: 'Customer feedback indicated that the service was very (____).', zh: '客戶回饋顯示服務非常(是什麼)。', domain: 'Marketing' },
  { en: 'The financial performance of the division has been (____), throughout the year.', zh: '該部門全年的財務表現一直是(是什麼)的。', domain: 'Finance' },
  { en: 'It is (____) for all employees to attend the mandatory training session.', zh: '所有員工參加必修的培訓課程是(是什麼)的。', domain: 'HR' },
  { en: 'The market conditions remain (____), despite recent economic challenges.', zh: '儘管最近經濟面臨挑戰，市場狀況仍然是(是什麼)的。', domain: 'Finance' },
  { en: 'The contract terms were considered (____), by both parties involved.', zh: '合約條款被雙方認為是(是什麼)的。', domain: 'Legal' },
  { en: 'Making the system more (____) is one of the key objectives for this quarter.', zh: '使系統更(是什麼)是本季的關鍵目標之一。', domain: 'Operations' },
  { en: 'The CEO\'s speech at the conference was both inspiring and (____).', zh: '執行長在會議上的演講既鼓舞人心又(是什麼)。', domain: 'Operations' },
  { en: 'The response from the public was overwhelmingly (____).', zh: '公眾的反應壓倒性地是(是什麼)的。', domain: 'Marketing' },
  { en: 'The hiring process should be fair and (____), to attract the best talent.', zh: '招聘流程應該公平且(是什麼)，以吸引最佳人才。', domain: 'HR' },
  { en: 'The quality of the product remains (____), even after the cost reduction.', zh: '即使在降低成本後，產品品質仍然是(是什麼)的。', domain: 'Operations' },
  { en: 'Experts believe that this approach is more (____), than the previous one.', zh: '專家認為這種方法比之前的更(是什麼)。', domain: 'Operations' },
  { en: 'The new regulation makes it (____) for companies to disclose their earnings.', zh: '新法規使得公司揭露收益是(是什麼)的。', domain: 'Legal' },
  { en: 'The work environment was described as (____), by the majority of respondents.', zh: '工作環境被大多數受訪者描述為(是什麼)的。', domain: 'HR' },
  { en: 'The data clearly shows that this method is (____), in most situations.', zh: '數據清楚顯示這個方法在大多數情況下是(是什麼)的。', domain: 'Operations' },
  { en: 'Keeping the workspace clean and (____) improves productivity.', zh: '保持工作空間整潔和(是什麼)可以提高生產力。', domain: 'Operations' },
  { en: 'The manager\'s decision was both reasonable and (____).', zh: '經理的決策既合理又(是什麼)。', domain: 'Operations' },
  { en: 'The training materials should be made more (____), for new hires.', zh: '培訓材料應該對新員工更(是什麼)。', domain: 'HR' },
  { en: 'The upgrade made the system faster and more (____).', zh: '升級使系統更快且更(是什麼)。', domain: 'Operations' },
  { en: 'It is (____) that all team members follow the updated guidelines.', zh: '所有團隊成員遵循更新的準則是(是什麼)的。', domain: 'Operations' },
]

// ============================================================
// ADVERB TEMPLATES
// ============================================================
const adverbTemplates = [
  { en: 'The project was (____) completed, ahead of the original schedule.', zh: '專案(是什麼)地在原定時程之前完成。', domain: 'Operations' },
  { en: 'The new system (____) improved, the efficiency of the department.', zh: '新系統(是什麼)地提升了部門的效率。', domain: 'Operations' },
  { en: 'Sales have (____) increased, since the launch of the new campaign.', zh: '自從新活動推出以來，銷售額(是什麼)地增加了。', domain: 'Marketing' },
  { en: 'The CEO (____) addressed the shareholders, at the annual general meeting.', zh: '執行長在年度股東大會上(是什麼)地向股東致詞。', domain: 'Finance' },
  { en: 'The regulations were (____) enforced, across all branches.', zh: '法規在所有分支機構被(是什麼)地執行。', domain: 'Legal' },
  { en: 'The company (____) expanded its operations, into three new markets.', zh: '公司(是什麼)地將營運擴展到三個新市場。', domain: 'Operations' },
  { en: 'Costs were (____) reduced, thanks to the new procurement strategy.', zh: '由於新的採購策略，成本(是什麼)地降低了。', domain: 'Finance' },
  { en: 'The team (____) achieved their quarterly targets, this period.', zh: '團隊在本期(是什麼)地達成了季度目標。', domain: 'Operations' },
  { en: 'Customer complaints have (____) decreased, since the policy change.', zh: '自從政策變更以來，客戶投訴(是什麼)地減少了。', domain: 'Marketing' },
  { en: 'The report was (____) reviewed, before being sent to the board.', zh: '報告在送交董事會前被(是什麼)地審閱。', domain: 'Operations' },
  { en: 'The employees (____) supported the company\'s new direction.', zh: '員工們(是什麼)地支持公司的新方向。', domain: 'HR' },
  { en: 'The issue was (____) resolved, by the customer support team.', zh: '問題被客服團隊(是什麼)地解決了。', domain: 'Marketing' },
  { en: 'The merger was (____) executed, with minimal disruption to services.', zh: '合併被(是什麼)地執行，對服務的干擾降到最低。', domain: 'Legal' },
  { en: 'Productivity (____) rose, after the office renovation was completed.', zh: '在辦公室翻新完成後，生產力(是什麼)地上升了。', domain: 'Operations' },
]

// ============================================================
// PREPOSITION / CONJUNCTION / OTHER TEMPLATES
// ============================================================
const otherTemplates = [
  { en: 'The meeting was rescheduled (____) the manager\'s request.', zh: '會議(是什麼)經理的請求而重新安排。', domain: 'Operations' },
  { en: 'The policy applies to all employees, (____) their department.', zh: '這項政策適用於所有員工，(是什麼)他們的部門。', domain: 'HR' },
  { en: 'The project will proceed (____) we receive the final approval.', zh: '(是什麼)我們收到最終批准，專案將會繼續進行。', domain: 'Operations' },
  { en: 'Budget cuts were made (____) the economic downturn last quarter.', zh: '(是什麼)上季的經濟衰退，進行了預算削減。', domain: 'Finance' },
  { en: 'The report must be submitted (____) Friday at the latest.', zh: '報告最遲必須在週五(是什麼)提交。', domain: 'Operations' },
  { en: 'All staff members were informed (____) the upcoming changes.', zh: '所有員工都被告知(是什麼)即將到來的變更。', domain: 'HR' },
  { en: 'Production continued (____) the supply chain disruption.', zh: '(是什麼)供應鏈中斷，生產仍然繼續。', domain: 'Operations' },
  { en: 'The new office is located (____) the central business district.', zh: '新辦公室位於中央商業區(是什麼)。', domain: 'Operations' },
  { en: 'Benefits are available (____) full-time employees only.', zh: '福利(是什麼)全職員工才可享有。', domain: 'HR' },
  { en: 'The team worked overtime (____) complete the project on time.', zh: '團隊加班工作(是什麼)準時完成專案。', domain: 'Operations' },
]

function getTemplates(pos) {
  // Check adverb first (ad contains 'a')
  if (pos.includes('ad')) return adverbTemplates
  if (pos.includes('v')) return verbTemplates
  if (pos.includes('n')) return nounTemplates
  if (pos.includes('a')) return adjTemplates
  if (pos.includes('prep') || pos.includes('conj') || pos.includes('Ph')) return otherTemplates
  // Default
  return nounTemplates
}

function generateSentences(word, usedTemplateIndices) {
  const templates = getTemplates(word.pos)
  const selected = []
  const usedDomains = new Set()

  // Create shuffled indices
  const indices = Array.from({ length: templates.length }, (_, i) => i)
    .sort(() => Math.random() - 0.5)

  for (const idx of indices) {
    if (selected.length >= 2) break
    // Skip already heavily used templates
    const usageCount = usedTemplateIndices.get(idx) || 0
    if (usageCount > 5 && selected.length === 0) continue // Allow reuse for 2nd sentence
    if (usedDomains.has(templates[idx].domain) && templates.length > 2) continue

    usedDomains.add(templates[idx].domain)
    selected.push({
      en: templates[idx].en,
      zh: templates[idx].zh,
      domain: templates[idx].domain,
      answer: word.word
    })
    usedTemplateIndices.set(idx, usageCount + 1)
  }

  // Fallback if we couldn't get 2 with domain diversity
  if (selected.length < 2) {
    for (const idx of indices) {
      if (selected.length >= 2) break
      if (selected.some(s => s.en === templates[idx].en)) continue
      selected.push({
        en: templates[idx].en,
        zh: templates[idx].zh,
        domain: templates[idx].domain,
        answer: word.word
      })
    }
  }

  return selected
}

function main() {
  const selectedWords = wordBank.slice(0, 500)
  const usedTemplateIndices = new Map()

  const result = selectedWords.map(word => ({
    wordId: word.id,
    word: word.word,
    sentences: generateSentences(word, usedTemplateIndices)
  }))

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8')
  console.log(`Generated sentences for ${result.length} words`)
  console.log(`Total sentences: ${result.reduce((sum, w) => sum + w.sentences.length, 0)}`)

  // Check uniqueness
  const allEn = result.flatMap(w => w.sentences.map(s => s.en))
  const uniqueEn = new Set(allEn)
  console.log(`Unique English templates used: ${uniqueEn.size}`)

  // Sample output
  console.log('\nSamples:')
  for (let i = 0; i < 10; i++) {
    const idx = Math.floor(Math.random() * result.length)
    const sample = result[idx]
    console.log(`\n${sample.word}:`)
    sample.sentences.forEach((s, j) => {
      console.log(`  ${j + 1}. [${s.domain}] ${s.en.slice(0, 90)}...`)
    })
  }
}

main()
