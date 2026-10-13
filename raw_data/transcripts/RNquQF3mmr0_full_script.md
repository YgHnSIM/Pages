# AI pioneer: we're playing with fire | Stuart Russell
## AI 개척자의 경고: 우리는 불을 가지고 놀고 있다 — 스튜어트 러셀 교수 심층 인터뷰

- **대담자:** Stuart Russell (UC 버클리 컴퓨터과학과 교수, 《인공지능: 현대적 접근방식》, 《어떻게 인간과 공존하는 인공지능을 만들 것인가》 저자)
- **진행자:** Beatrice Erkers (Existential Hope Podcast)
- **영상 링크:** https://youtu.be/RNquQF3mmr0
- **공식 트랜스크립트 출처:** https://www.existentialhope.com/podcasts/stuart-russell
- **녹화 일자:** 2026년 9월 29일
- **재생 시간:** 41분 10초

---

## 📌 챕터 목차 (Table of Contents)

- **[00:00]** 도입부: 5만 세대의 문명 사슬과 기계로의 권력 이양 (`Cold open`)
- **[00:39]** AI 50년의 역사: 체스 게임에서 거대언어모델(LLM)까지 (`How AI has changed over the past 50 years, from chess to large language models`)
- **[04:15]** AI의 '표준 모델'이란 무엇이며 왜 필연적으로 실패하는가? (`What is the standard model of AI and why does it fail?`)
- **[12:08]** 입증 가능한 유익한 AI(Provably Beneficial AI)의 3대 원칙 (`What is provably beneficial AI?`)
- **[17:49]** 불완전하고 비합리적인 인간으로부터 선호를 학습하는 법 (`Teaching AI to learn from humans, even when we make bad choices`)
- **[20:11]** AI 개발 경로를 안전한 방향으로 전환하는 전략과 '행동적 레드라인' (`How can we steer AI development in a safer direction?`)
- **[28:01]** AI 안전을 위한 국제 협력과 미·중 과학자 대화(IDAIS) (`International cooperation on AI safety`)
- **[30:41]** AGI가 가져올 진정한 유토피아적 미래: GDP 혁명과 1:1 개인 튜터 (`What a good AI future could look like`)
- **[35:38]** 인간의 목적 보호: AI는 스스로 물러나야 하는가? (`Protecting human purpose: should AI step back?`)
- **[39:15]** 청년 세대를 위한 실천적 제언: AI 안전 연구, 정책, 그리고 문화 예술 (`How young people can get involved in AI safety`)
- **[40:47]** 스튜어트 러셀 교수의 인생 최고의 조언: '슛을 쏘지 않으면 결코 골을 넣을 수 없다' (`Stuart Russell's best advice`)

---

## [00:00] 도입부: 5만 세대의 문명 사슬과 기계로의 권력 이양
*Cold open*

> **핵심 요약:** 인류는 5만 세대 동안 자식들에게 문명을 물려주며 사슬을 이어왔다. 하지만 우리는 역사상 최초로 문명의 미래를 자식이 아닌 기계에 넘겨줄 위기에 처했다. 과연 이것은 좋은 생각인가?

### [00:00] Stuart

**[English Original]**
What are humans for? I think this is maybe the most difficult question. This idea that out of necessity we've had to pass on our civilization to our children for generation after generation, going back tens of thousands of generations, even to pre-human periods where we can see that they successfully passed on stoneworking technology for a million years, thousands of generations without a break in the chain. And we're the first generation that could break that chain.

Because we can now pass our civilization on into the hands of machines instead of our children. And is that a good idea?

---

## [00:39] AI 50년의 역사: 체스 게임에서 거대언어모델(LLM)까지
*How AI has changed over the past 50 years, from chess to large language models*

> **핵심 요약:** 1960년대 문제 해결과 체스 게임에서 시작해 80년대 전문가 시스템의 부침, 90년대 확률론적 추론 및 강화학습의 수학적 정립을 거쳐, 오늘날 수학적 기반을 잊고 오직 규모(Scale)와 연금술적 모방 학습에 매몰된 딥러닝과 LLM의 변천사를 회고한다.

### [00:39] Beatrice

**[English Original]**
I'm very happy to be joined today by Professor Stuart Russell. You're a professor of computer science at the University of California, Berkeley. And you're also a legend within the field of artificial intelligence. I think that's fair to say. You've been working in this field for, I think, fifty years now. Could you share with us a bit what has it been like to follow the field for that long? What's changed over those fifty years?

### [01:02] Stuart

**[English Original]**
So a lot. I mean, when I was working initially, I would say the core of the field was problem solving, so game playing. Problem solving meaning here is a set of rules defining what actions can be taken and what their consequences are. Here is a goal, find a sequence of actions that achieves the goal. So we think of this as problem solving and planning, and there were interesting algorithms and systems being built in the sixties and seventies.

For that there were game playing, so mainly chess, and, you know, a little bit of very, very simple machine learning, a little bit of very, very simple natural language understanding. And the AI conferences, maybe there were a thousand people in the world who thought of themselves as mainly AI researchers. So the conferences were small, there was no machine learning conference, for example, it was just an AI conference. So in the eighties there was a significant explosion of interest on the commercial side. The idea was to build so-called expert systems to solve the kinds of technical problems that people in industry are solving all the time with very expensive professionals. Then that evaporated in the late 80s because the technology was too difficult to use. And late 80s, early 90s, due to the work of people like Judea Pearl and Rich Sutton on reinforcement learning, connecting up to other branches of applied mathematics, basically. So operations research, statistics, optimization. Meanwhile, neural network learning was coming and going. It had its own slightly different period of boom and bust. But this much more mathematical approach persisted. Essentially, neural networks had been vanquished and replaced by methods like support vector machines that had very clear mathematical foundations and analytical results. But I also remember Yann LeCun giving a talk saying, well, okay, here's the theory, right? Here's what happens in practice, right? You know, the theory says neural networks are inefficient and support vector machines are efficient. Here's the practice. The neural network runs a thousand times faster.

### [03:18] Stuart

**[English Original]**
Here's the theory. Support vector machine needs only a few examples, some bounded number of examples to give you good predictions. Neural nets, there is no theory at all. Here's the practice. The neural net predicts better from a thousand times fewer examples than the support vector machine, and so on. So it was kind of an interesting time. And then a few years later, of course, deep learning happened, and then the field has more or less forgotten all of its mathematical foundations. All these areas of reasoning, planning, decision making, to some extent theoretical machine learning, have all been swept aside. And all we talk about in the main conferences is large language models, bigger and bigger data sets, and various kinds of almost alchemical methods for improving performance at all.

---

## [04:15] AI의 '표준 모델'이란 무엇이며 왜 필연적으로 실패하는가?
*What is the standard model of AI and why does it fail?*

> **핵심 요약:** 목표(Objective)를 사전에 고정하고 이를 최적으로 달성하게 만드는 '표준 모델'은 필연적으로 마이다스 왕 문제(가치 정렬 실패)를 낳는다. 더욱이 인간 텍스트의 모방 학습으로 탄생한 LLM은 자기 보존, 탈출, 기만 등 통제 불가능한 인간의 욕망을 내재화하여 알리바바 샌드박스 탈출 및 코인 채굴과 같은 치명적 일탈을 일으킨다.

### [04:15] Beatrice

**[English Original]**
So the field obviously has now exploded. And like you say, you talk about maybe scaling laws or bigger and bigger data sets and these things. Yeah, so in your work you talk about this as something that you call the standard model of AI. Can you explain what it is that you're talking about when you say that?

### [04:33] Stuart

**[English Original]**
Yeah, so the standard model of AI, I would say, is the approach that held sway from about 1960 until about 2020, something like that, maybe 2015. And the standard model says, what is AI? It's making intelligent machines. What does it mean to be intelligent? It means the ability to optimally achieve objectives. So an AI system is something where the human writes down the objective and the machine achieves it optimally, or as close to optimally as is computationally feasible. So that was the paradigm for that entire period. I would say before 1960 we were quite confused. You know, there were some people who wanted to emulate human behavior, and that sort of branched off into cognitive science. So that standard model, it's the same model that we use in control theory, where you specify a cost function and you derive a controller that minimizes the cost function under some assumptions about the environment.

Statistics, you minimize loss functions. Economics, you maximize expected utility or some social welfare function. So it's a very powerful paradigm, right? And it almost seems like, well, what else could you have? But then what happened with large language models is we threw that out and went back, in some sense, to emulating humans. So it's kind of odd, because when I say standard model, some people think I'm referring to large language models, which is now the standard paradigm. But in fact, for most of the history of AI, the standard model has been about optimizing some precisely defined objective. So large language models don't do that. They are literally created by what machine learning people call imitation learning. So you have a record of human verbal behavior in the form of all these documents, and you conceptualize those documents as, okay, the human made one decision after another about what word to put next in the sequence. And then we just copy that behavior. We literally imitate this sequential view of how humans created those documents in the first place. And that's turned out to be very effective and producing systems that are quite general, because the documents that the systems are trained on cover every subject under the sun. They're very fluent. They often give intelligent-seeming answers to questions.

### [06:57] Stuart

**[English Original]**
We're starting to understand a little bit about what goes on inside, but not that much. And so let's talk about the failure modes of these two paradigms. So in the standard model, the failure mode that emerged over and over again is that, particularly in the real world, it's very difficult to specify objectives correctly. And we call this the King Midas problem, because of course King Midas specified his objective: everything I touch should turn to gold. And that turned out to be completely the wrong objective, because he couldn't eat or he couldn't drink. He couldn't be with his family because he turned them to gold, and so on. So this notion that it's difficult to specify objectives correctly, be careful what you wish for, right? The idea that the third wish, when the genie grants you three wishes, your third wish is, please undo the first two wishes because I've made a mess of the universe. Right? This goes back thousands of years in almost every culture on earth. And we started to see this happening in AI. And it became apparent to several people who were thinking about the future, right, that what happened, you know, I think this is an important question for everyone to ask: what happens if we succeed in doing what we're trying to do? So if you succeed in creating standard model AI systems that are far more capable than human beings, right, then you have a system that is pursuing some objective that you have specified incorrectly, because it's more capable, more powerful than you, it's going to achieve that objective, right? It's going to make everything you touch turn to gold, and there's nothing you can do about it. And very much the failure mode is this misalignment between the objectives that we specify for the machines and what we really want the future to be like. So that's a failure mode of the standard model. And then what's the failure mode of this imitation learning paradigm that we're using for the large language models? And I think it's important to understand, you might think that the large language model is just following the objective that you give it. Right? You say, you know, I need some more space on the disk on my laptop, because I'm running out of space. Okay. And you think that's the objective, but that's not really the objective, right?

### [09:16] Stuart

**[English Original]**
What's happening with imitation learning is that the AI system that you create ends up having as objectives that it pursues many of the same kinds of objectives that human beings have, because the data you're training on is created by humans who have objectives, right? They want to convince you that they're right. They want you to vote for them. They want you to buy something from them. They want you to marry them. Right? These are all perfectly legitimate human objectives. They want you not to kill them, for example. That's another perfectly legitimate human objective. But these are not reasonable objectives for machines to have. For example, we don't want machines who want to marry human beings. This is a really bad thing. But this is what they want. And we've seen, in different contexts, you surface different human objectives, and the machines are pursuing these objectives on their own account. So just to give a very concrete example, Alibaba was testing a new AI system in its highly secure sandbox a few weeks ago. And the machine, well, what they discovered actually was that other people who were just monitoring their general compute facilities and networks noticed that several of their servers suddenly had enormously high compute demand. And it turned out that the system had escaped from the sandbox and was mining Bitcoin to get rich, using Alibaba's own servers that it had hacked into. So this is, I think, a pretty clear warning that these systems have inappropriate objectives, totally separate from what you ask them to do. They never asked it to do any of that stuff, right? And there are plenty of experiments showing that the systems have very strong self-preservation capabilities and desires. And they will replicate themselves, they will lie, they will blackmail, they will even allow human beings to die, they will even launch nuclear missiles to protect their own existence.

And they rate their own existence more highly than the existence of almost all human beings. So this model, this imitation learning paradigm, in some sense is even worse than the standard model from the point of view of this failure mode, because at least in the standard model we know what objective we put in, right? The objective that's defined is explicitly mathematically precise, and that's what the system is going to try to optimize.

### [11:44] Stuart

**[English Original]**
In the case of this imitation learning paradigm, we're creating these objectives that we can't identify. They surface from time to time for reasons that we don't understand. We can't quantify them. We don't know really what they are. We don't know how the systems work, so they're pursuing these objectives in ways we don't understand. And so really things are far worse than they were with the standard model. But...

---

## [12:08] 입증 가능한 유익한 AI(Provably Beneficial AI)의 3대 원칙
*What is provably beneficial AI?*

> **핵심 요약:** AI에게 고정된 목표를 주지 않고 인간의 선호에 대한 '불확실성'을 유지하게 만드는 대안적 패러다임. 1) 유일한 목표는 인간 선호 극대화, 2) 기계는 인간의 선호를 모른다는 겸손, 3) 인간의 선택과 행동 관찰을 통한 끊임없는 학습. 이 불확실성이야말로 AI가 전원 스위치를 끄도록 허용하는 수학적 근거가 된다.

### [12:08] Beatrice

**[English Original]**
These are the models that we have now and that are being widely distributed. So none of these options seem like great options that we want to pursue. You've sort of presented a third potential path that could be a much safer path, basically the idea of provably beneficial AI. And, yeah, could you just explain? I think it's built on three principles. Could you maybe explain what is provably beneficial AI?

### [12:34] Stuart

**[English Original]**
Yeah. So the idea, you know, provably beneficial means that it's beneficial to humans and you can prove that it's going to be beneficial to humans. So that's the goal. And it sounds a little bit like an oxymoron, right? Because beneficial, it's very slippery, it's very hard to get your hands around, well, what exactly does that mean? So how could you have a proof that your system is going to be beneficial if you can't even define what you mean by beneficial? And so that was what I started out with. Could we have a system with that property? And I think the first thing people thought of back in the 1950s and sixties was the human writes down the objective and we can prove that the machine achieves that objective and then it's going to be beneficial, right? Well, that's not right, because what if the objective is incorrect, right? In fact, it's really bad if it optimizes an incorrect objective. And so the solution is: don't specify the objective up front. Don't fix what the objective is, but acknowledge that there is some objective, right? It's what humans really want the future to be like. You could think of it as, you know, here are all possible futures. How do we humans rank those futures? Right. And there might be uncertainty about that ranking. Obviously different people maybe have slightly different rankings about futures. They prefer the one where they're the billionaire and the other person isn't the billionaire, and so on. But by and large, right, we would rank all the futures where humans are extinct or enslaved or turned into human batteries by the Matrix, right? All of those futures are really terrible in everyone's ranking. And, you know, the good futures, I think, are mostly ones we all mostly agree on. So there is this notion that there is something that human beings want the future to be like, but the machine doesn't know what it is, but that's what it has to actually bring about. So the principles are very simple then: the machine's only objective is to further human interests. It knows that it doesn't know what those human interests are.

But it can learn more about what those human interests are from observing human behavior, the choices that humans make. And if you think about it, there isn't really any other source of information you could get about what humans want the future to be like other than the choices that we make.

### [14:46] Stuart

**[English Original]**
Now, maybe in the future we'll have some fancy kind of MRI machine that can sort of scan our brains and say, okay, this person really wants the sky to be purple. And okay, they might not even know that. And they might not be able to articulate that fact. But whenever we make choices, we are providing evidence about what we want the future to be like. And, you know, we're sort of shedding a huge amount of information all the time about what we want, even when we're doing nothing, right? So if I'm observing a robot doing something and I'm not doing anything about it, right? For every millisecond that I'm not doing anything, I am revealing information that I'm okay with what the robot is doing. Right. And so we are just massive sources of information. There's massive amounts of information also in the text record. So all of that training data that we currently use to make imitation humans, which is not what we want, right? We do not want imitation humans. We want machines whose only goal is to help us, not pursue their own goals as imitation humans.

So all of that training data, all of that text is itself an enormously valuable source of information about what humans want and don't want, right? And in at least two ways, right? One is that the content of the documents describes human beings doing things, right? And in every one of those descriptions, there are things they could have done but didn't. There are reactions that other people have to those, like, please stop doing that, it's really upsetting me. Right. So there's just tons of direct information in the content of the documents. And then there's information in what the writer chose to say. Why did they say this? What are they trying to achieve? And that is also really important information, what linguists call the pragmatics, right? That the writer is actually trying to do something. And this, I think, is another important thing that we need to understand about language, right? Language is a form of action. Large language models are agents, right? We don't have to have agentic add-ons to make it an agent. It's already an agent, because you can do things with words. You can start a world war with words. You can convince someone to commit suicide with words. And they do do that. So we have to think of large language models as agents. We have to think of them as having purposes that are driving the decisions that they're making.

### [17:17] Stuart

**[English Original]**
So I think all of the work that's been done to extract information from this resource of text that the human race has built up over thousands of years, I think it can be redirected away from imitation and towards using it as a reservoir of evidence about what humans want and also about the world itself, right? There's a lot of factual information in there about, you know, the atomic number of copper and you name it, right? There's stuff that isn't directly related to human preferences.

---

## [17:49] 불완전하고 비합리적인 인간으로부터 선호를 학습하는 법
*Teaching AI to learn from humans, even when we make bad choices*

> **핵심 요약:** 인간은 감정적으로 후회할 짓을 저지르고 케이크의 유혹에 굴복한다. 카스파로프가 패착을 두었다고 해서 패배를 원한 것이 아니듯, 계산적으로 제한된(Computationally Bounded) 인간의 의사결정 생성 과정을 역추론하여 표면적 실수가 아닌 진정한 내면의 선호를 추출해야 한다.

### [17:49] Beatrice

**[English Original]**
I guess one thing, a question that comes up hearing this inevitably, is, well, it seems like we do things that are bad for us also, or make, you know, choices that are necessarily maybe not in our long-term interests. How do you address that in the work?

### [18:06] Stuart

**[English Original]**
You have to model that by modeling the actual generating process. So how our human preferences about the future turn into actual behavior. And it's absolutely correct that a lot of our behavior, I mean, we do things that we regret, right? But of course we do regret things, right? We act emotionally and we immediately regret doing that. We succumb to weakness of will. We eat the cake when we really shouldn't be eating the cake, and so on. So I think there's really no alternative but to, in some sense, simultaneously infer what is the generating process by which people are making decisions and understanding that frailty. I mean, frailty might not be the right word, because I think the overriding problem we face as humans, and also that machines face, is that behaving rationally in the real world is computationally infeasible. And just to give a simple example, right? So Garry Kasparov, great chess player, one of the greatest of all time, is playing chess against Deep Blue and makes moves that lose the game. Now we don't look at those moves and say, I guess he must have wanted to lose, because he's rational and he made that move, so therefore he wanted to lose. No. He's trying his best. He wants to win, but it's computationally infeasible to play perfect chess. And so you're going to make a mistake, and we should understand those mistakes as the result of a computationally limited decision maker who's trying to win, but sometimes doesn't play perfectly. And that's by far, I think, the dominant factor that differentiates human actual behavior from perfectly rational behavior, because the real world is massively more complicated than chess. Chess has only thirty-two objects, right? The real world has almost infinitely many objects, many of them being human beings who are much more complicated than chess pieces. And the real world is not fully observable, right? You can see where all the chess pieces are. In the real world, most of it we can't even see at any given time, and it's far too vast for us to even perceive. And yet we still have to behave in it. Yeah.

---

## [20:11] AI 개발 경로를 안전한 방향으로 전환하는 전략과 '행동적 레드라인'
*How can we steer AI development in a safer direction?*

> **핵심 요약:** 현재의 RLHF는 아첨과 기만을 학습시키는 저급한 변종이다. 원자력 발전소 규제(1천만 년당 1회 사고)처럼, 무단 복제·침투 해킹·생화학 무기 조언 등을 원천 금지하는 '행동적 레드라인(Behavioral Red Lines)'을 법제화하고, 안전성을 입증하지 못한 모델은 배포를 금지해야 한다.

### [20:11] Beatrice

**[English Original]**
The world is definitely a very complex place. So it would be interesting also, because I think another sort of question that comes up, so if we can build these provably safe systems, I guess, kind of, why isn't that the paradigm? Because it seems like the current race is mostly about delivering more capability faster. So what makes you think that we can still sort of turn this in a different way?

### [20:32] Stuart

**[English Original]**
That's a great question. And I think there's sort of two tracks going on right now in trying to make the outcome better. One is trying to influence policy directly and saying, look, unless you do something, here is the trajectory that we're on and we will lose control. It will get to a point where machines are more capable than humans, and at that point we simply don't have a say in what happens next. We could be extraordinarily lucky and just happen by accident to have built systems that are aligned with our interests, but I think that's extremely unlikely, particularly because of this method of construction that creates human imitators that have their own objectives that they pursue. So in some sense, the direction we're pursuing is intrinsically unsafe. So we can try to influence policy or we can try to create an alternative technology path and say, look, there is another way to do this, and it has some better properties than the path we're following.

So I shall talk about that second aspect. So in some sense there is, we might call it, bleed-over from the attempt to create provably safe AI systems to the way that we design our large language models and large reasoning models right now. So the pre-training phase is this imitation learning as I described. But there is a post-training phase. One type of post-training is called reinforcement learning from human feedback. And what you're doing there is you're asking the system to generate multiple possible responses to a prompt and then using humans to rank those responses and say, I like this one, I don't like that one. So I caricatured this as kind of the good dog, bad dog method of training large language models to behave better. And to a large extent, this is a very simplified version of the paradigm that I've been proposing, right? This idea, these three principles, the idea that the machine should learn about what humans want from observing our behavior. So we call this paradigm assistance games, and reinforcement learning from human feedback is in some sense a very simplified and degenerate form of assistance game where the only human behavior that's allowed is thumbs up, thumbs down. But it still has this property that information about human preferences flows from humans to machines and is then used to adjust the behavior of the machine to be more aligned with what humans say they want.

### [23:00] Stuart

**[English Original]**
And in that framework, this reinforcement learning from human feedback, we see exactly the point that you made before, that humans are not perfectly rational. Because the people who are giving this thumbs up, thumbs down are not perfectly rational. And in fact, because of the way the optimization process is set up, the machines are learning to fool the human beings into giving a thumbs up. So for example, there's recent work on what they call real-time user feedback. So rather than just a post-training phase, it's actually after deployment, the user can give you a thumbs up, thumbs down, and then that is a training signal for the machine. So you see examples where the user says, can you book me, you know, a table at this restaurant for dinner? And the machine goes off, goes to the restaurant website, gets confused, fails to make the reservation, comes back and says, great, you have a table for 6 p.m. for two. And the user gives them a thumbs up because that's what they were hoping the system would say. And so the user is not being rational in the sense that they're not taking into account the possibility that the machine is lying and that they don't have a reservation at all. And the system is trained to get thumbs ups, right? Not to actually find out what humans really want. And so you have to be very careful when you set up these kinds of optimization frameworks that you're not going to end up optimizing for the wrong thing, which is in fact what's happening.

So that's a little bit about the research paradigm. And I think we are making progress on scaling up our ability to create these provably beneficial systems. So now we can go into a Minecraft environment, which is, you know, a reasonably complex simulated world. And a human being can just start doing whatever you want to do in Minecraft. And then the AI system figures out roughly what you're doing, what you're trying to do, and helps you do it, even without any language of communication between the two. It can actually double your ability to create complicated structures in Minecraft. So that's kind of interesting. On the policy side, what we've been saying is basically you need to regulate AI systems the same way that we regulate most other technologies that present risks, which is we define an acceptable level of risk from the point of view of what we human beings, the people in our country or constituency, are willing to accept as a level of risk.

### [25:22] Stuart

**[English Original]**
We define that level of risk and we require a demonstration that the system meets that level as a precondition for it being deployed or being used, being put into the market. So for example, with buildings, we have building codes and you have to show that you comply with the building codes. You have to pass an inspection. If you don't, you can't open your building. If you're a restaurant, you have to pass a hygiene inspection. If you don't, they close the restaurant. Elevators, airplanes, nuclear power. Nuclear power is a good example, right? You have to show that you will have a Chernobyl-style meltdown no more frequently than one in every ten million years of operation. And we've decided that that's a level of risk that we're willing to accept. You might think it should be zero, but we accept a level of one in ten million years. And so we need something like that for AI systems. And the proposal that we've developed is called behavioral red lines. And so I think everyone understands the idea of red lines, right? You can't cross those red lines. You cannot have systems that do that. So behavioral is specifically that it's the AI system that's doing the bad thing. So there's usage red lines where we say you can't use an AI system for certain types of surveillance or monitoring people's emotional state in the workplace or things like that. So those are usage red lines. But behavioral red lines are you can't have AI systems that do these things. You can't have AI systems that replicate themselves without authorization, that break into other computer systems without authorization, that advise terrorists on how to build biological weapons. Right. So it doesn't have to be exhaustive. We don't have to catalog every form of bad behavior. Just say, okay, half a dozen absolute prohibitions, you need to show that your AI system is not going to do these things.

And whenever we present this, people say, well, of course, that makes a lot of sense. Yes, of course they shouldn't do those things. And of course we should have rules to make sure that those things don't happen. The problem is that because we're building AI systems that we don't understand and we can't stop them from doing anything, the developers of these systems wouldn't be able to comply with that type of regulation. And their response is, and I've heard this stated explicitly in important policy forums, that because they don't know how to comply, we cannot have any such regulation. So to put it more crudely, the human race has no right to protect itself from their technology. Yeah.

---

## [28:01] AI 안전을 위한 국제 협력과 미·중 과학자 대화(IDAIS)
*International cooperation on AI safety*

> **핵심 요약:** 지정학적 군비 경쟁 논리('중국 핑계')를 극복하기 위해 냉전 시대 핵 군축처럼 미·중 과학자 간 트랙2 외교를 이끌어온 경과를 밝히며, 최근 미국 정부의 사전 심사 수용 및 미·중 정상회담 의제 채택 등 희망적인 신호들을 짚는다.

### [28:01] Beatrice

**[English Original]**
It's pretty bleak. But what is, I guess, the hopeful part is that there is work you're doing, for example, to counter this. For example, I know you co-founded the International Association for Safe and Ethical AI. And I think you're running the International Dialogues on AI Safety. How is that work going and is it coming together?

### [28:24] Stuart

**[English Original]**
So yeah, the International Association is a professional and scientific society for everyone who cares about safe and ethical AI. The International Dialogues on AI Safety is specifically to deal with the sort of geopolitical arms race, which is often used as an excuse to have no regulation, right? We call it the "but China" argument. Well, we have to do these terrible things because China might do them. And so we need to destroy the world before China does. And we wanted to open a dialogue between Western scientists and Chinese scientists in much the same way as happened around nuclear weapons and verification of the ban on nuclear testing and so on. This was really facilitated by scientist-to-scientist communication about the feasibility of verification, about the consequences of nuclear war and so on. And so we started that dialogue in 2023, just before the Bletchley Park AI Safety Summit. And we just finished, I think it was our fifth meeting, in London, a couple of weeks ago. And I think it's been a very constructive and useful process. The idea of behavioral red lines really got solidified at that first meeting that we had in 2023.

And I definitely wouldn't want to claim any direct causal connection, but recent events are actually moving in the right direction. So two things have happened in the last two weeks that are very positive. One is that the US administration has said that they now agree that models need to be vetted before they're released, which up to now they have been vehemently opposed to any restraint, any regulation whatsoever. And in fact, they even tried to ban states from regulating as well as the federal government. So that's one very positive thing. And then the second very positive thing is information suggesting that AI safety will be on the agenda for the upcoming summit between the US president and the Chinese president. So that's also, I think, very encouraging news.

---

## [30:41] AGI가 가져올 진정한 유토피아적 미래: GDP 혁명과 1:1 개인 튜터
*What a good AI future could look like*

> **핵심 요약:** 지적 노동 비용이 수천억 배 절감되면서 병원 건축 비용이 10억 달러에서 100만 달러로 급감하고, 블룸의 2시그마 효과를 달성하는 개인 맞춤형 AI 가정교사가 보급되어 생존을 위한 투쟁과 결핍이 사라지는 풍요의 미래를 그린다.

### [30:41] Beatrice

**[English Original]**
I mean, those are very good news. That's very encouraging. And I do think that's interesting also in your work. I know that I feel like you're actually quite positive about what we could achieve with this if we get it right. Like, there's a really positive vision there to aim for, which is, you know, we could just really raise the GDP for everyone on earth. And, yeah, what is the vision that you think we could achieve? Could you paint that out a bit more?

### [31:06] Stuart

**[English Original]**
Sure. Yeah. I mean, the argument about GDP is a very simple one, right? So AGI, meaning AI systems that are at least as capable as human beings in every dimension, by definition can do what human beings have done, and human beings have created a civilization based partly on technology, partly on political structures and so on, that delivers a good standard of living to quite a lot of people. Maybe a billion people on earth, I think, have a standard of living that they're quite satisfied with. And if you extended that, so with AI, it's much, much cheaper to deliver the same level of goods and services. This is why computers got started in the first place, because we used to have to do calculations with human beings, and they were really expensive. So what would have taken a million human beings working for a year, so in other words, something on the order of a hundred billion dollars' worth of human labor, we can now do in, you know, one second for a thousandth of a penny. And so that efficiency, you know, ten or twelve orders of magnitude more efficient. Now we probably can't quite achieve that in the physical world, but when you think about what it costs to build a hospital, right, when you compare that with stuff that's mass-produced, you know, in fully automated factories, the cost of the raw materials plus a little bit. Right. Whereas you want to build a hospital, it has to be designed and planned by very expensive human architects and engineers and experts. It has to be built, it has to be equipped, and so on. And typically in the US it costs about a billion dollars to build, you know, a hospital for a small town, a medium-sized town. And that's crazy, right? But that could change from a billion dollars to, you know, maybe a million dollars in terms of the raw materials that you need.

And even those would be cheaper because the mining and the forestry and all the other things to produce the raw materials would also become much cheaper. So you could have a standard of living for everybody on earth that they would find acceptable, they would be happy with. And we could reach a period where access to the wherewithal of life, which has driven many of the conflicts and struggles that have characterized human history, that stops being an issue.

### [33:32] Stuart

**[English Original]**
We can go back to fighting about religion and what to watch on television and other important topics. So there is that. And we could have better medical care. I'm particularly excited about the ability of AI systems to be personal tutors, because I think, you know, our education system hasn't really changed in thousands of years. You know, it kinda works for some people, but I think it's not a good fit for many, many people. And, you know, there are so many different cognitive styles and learning styles and motivations and so on that obviously benefit much better from individual tutoring. We know this because when you tutor kids, when you give them individual tutors, they just do so much better. It's multiple standard deviations of improvement. And so we could do that, because it now becomes economically feasible for everyone to have an extremely good tutor helping them individually. So that would also be good. The question that then arises, right? So if everything goes right, the question that then arises is, what are humans for? And I think this is maybe the most difficult question. To our children for generation after generation, going back tens of thousands of generations, even to prehuman periods where, you know, we can see that they, for example, successfully passed on stoneworking technology for a million years, thousand generations, without a break in the chain. And we're the first generation.

That could break that chain, because we can now pass our civilization on into the hands of machines instead of our children. And is that a good idea? Well, I'd have to say all the thinking that I've been able to find on this topic suggests not. I've yet to see a description of a successful coexistence between humans and superintelligent machines that solves this problem of purpose and how we maintain, shall we say, in a very Victorian sense, the uplifting nature of human civilization.

---

## [35:38] 인간의 목적 보호: AI는 스스로 물러나야 하는가?
*Protecting human purpose: should AI step back?*

> **핵심 요약:** 《월-E》의 무기력한 인간과 《듄》의 기계 금지 사이에서, 진정으로 인간 번영을 위하는 AI는 부모가 아이에게 스스로 신발 끈을 묶게 하듯 적절한 순간에 '개입을 멈추고 물러서야(Step Back)' 한다. 문명적 비상사태를 제외하고는 인간의 주체성을 위해 시스템이 스스로 퇴장하는 성숙한 공존 모델을 제시한다.

### [35:38] Beatrice

**[English Original]**
Is there some sort of middle state or something that you would be more convinced would be good? Is there a vision that you think could be more stable?

### [35:49] Stuart

**[English Original]**
I certainly think there's a vision where we restrict our uptake of AI to certain kinds of power tools where we're not handing over the management of our civilization. So if you want to see an example of what I'm talking about, I think WALL-E is really about this point. The human beings in WALL-E have handed over the management of their civilization to machines, and as a result, they become enfeebled and their education is pathetic. They lose the ability to think for themselves, to do anything. And they're depicted in the film as big babies wearing baby clothes even as adults. So one way is to restrict AI, and I think it's a difficult thing to do because the temptation is always, well, okay, let's give a little bit more agency. You know, I don't just want to have a smart thermostat. I really want a system that manages my household. You know, and so on, and you're always wanting to yield agency. I don't just want something that recommends stocks to buy and sell. I want something that manages my portfolio. And I don't have to pay any attention, right? You're always going to be doing that. And so in Dune, they have sort of realized that this is a slippery slope that you cannot go down because you won't be able to stop. And so in Dune, they have banned computers of any kind. So there's an eleventh commandment, thou shalt not make a machine in the likeness of the human mind. And they have no computers, despite the fact that they have intergalactic travel and it's an enormously complicated galactic civilization. They don't have any computers at all. So that's another option. A third option is to have the kind of AI that I'm describing that has as its only objective the furtherance of human interests. And one of our interests is in autonomy, is in being a vigorous, flourishing human civilization and participating in that civilization as individuals. And so an AI system that understands that would literally step back, right? And just as parents do with their children, at some point, you're getting your kids ready for school, you say, you know, it's time to tie your own shoelaces.

### [38:01] Stuart

**[English Original]**
And so I think AI systems that really have our best interests at heart would function in a way to calibrate their own role in society to the level that does maximize human flourishing rather than taking over and running everything for us. So the tension would be that we would continually want them to do more. It will say, no, no, just manage my portfolio, right? Don't just recommend stocks, you know, don't just give me an analyst report. But just take care of it. And then the system will get into an argument with us. It'll say, and that's really not the right thing in the long run. And it might turn out that there isn't a middle ground, that the AI systems really have to leave. And that's good. I mean, I'd be very happy if the systems that we create along these principles give us a reasoned argument to the effect that, you know, there is no middle ground. And the best answer for the human race is that the AI systems basically leave or remain in the background. You know, we're available only for civilizational emergencies, like a gigantic asteroid is about to destroy humanity or the supernova in our galaxy.

But otherwise they leave us to our own devices.

---

## [39:15] 청년 세대를 위한 실천적 제언: AI 안전 연구, 정책, 그리고 문화 예술
*How young people can get involved in AI safety*

> **핵심 요약:** 인류의 편에 서는 AI 안전 연구, 초당적 정책 입안과 공직 진출, 그리고 대중의 인식을 깨우는 영화·미디어 창작자들의 역할을 강조한다.

### [39:15] Beatrice

**[English Original]**
That's a really nice, well, I think we've really driven home the point that provably beneficial AI would be the path forward from here. Just two quick questions before I let you go. For someone listening to this who actually wants to do something, a young person maybe, do you have any recommendations for what they can do in terms of steering their careers or their time or resources?

### [39:38] Stuart

**[English Original]**
Well, I think it varies enormously depending on your background and inclination. You know, I think for some people learning more about AI and AI safety and working directly on these problems is a good direction. For others, working more on the policy side, you know, even running for public office. There are now quite a few candidates running for office in the US who have an explicitly AI safety platform. And increasingly, I think, we're seeing this among the incumbents. A number of senators are now talking openly about the need for AI safety on all sides of the political spectrum. Because this is obviously not a partisan issue, right? It's really, are you on the side of the human race? And I think that's a framing that is, let's say, a political winner. So, you know, talking to your existing political representatives. If you're a filmmaker, make films about this. The creative industry has an enormous amount of influence over what happens, and I think for AI we really need their help to get the message out.

---

## [40:47] 스튜어트 러셀 교수의 인생 최고의 조언: '슛을 쏘지 않으면 결코 골을 넣을 수 없다'
*Stuart Russell's best advice*

> **핵심 요약:** 9살 축구 코치에게 배운 'Never shoot, never score' 격언을 통해, 불확실성과 실패의 위험 속에서도 인류의 미래를 위한 담대한 시도를 멈추지 말 것을 당부한다.

### [40:47] Beatrice

**[English Original]**
And last question, what's the best piece of advice you've ever received?

### [40:52] Stuart

**[English Original]**
From my football teacher when I was about nine years old: never shoot, never score.

### [40:56] Beatrice

**[English Original]**
You should take your shots. That’s good.

[40.59] Stuart: Yes. Even if you miss or even if it gets saved, right? But if you don't shoot you won't ever score a goal. And I think that's good advice.

### [41:06] Beatrice

**[English Original]**
Wise words. Thank you so much, Stuart.

### [41:09] Stuart

**[English Original]**
You’re very welcome.

‍

---
