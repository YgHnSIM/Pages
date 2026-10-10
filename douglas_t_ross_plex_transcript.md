# Douglas T. Ross's Plex the precursor to structs - 스크립트 전문

- **원본 영상 URL**: https://youtu.be/M5XDPCefJ_s
- **채널**: TheStandupPodClips
- **영상 길이**: 18:19
- **추출 언어**: English (영문 전문 자막)

---

So, so in the talk, another thing is someone requested it too and I need my memory refreshed on it.
What is Plex?
I didn't understand this.
This is like
>> Really?
Yeah, well, I'm dumb.
You have to remember.
Very stupid and I would might have been a little distracted during this portion.
I had a six latest buyer run going and I looked up and I went, "What is Plex?"
Okay.
[laughter]
So, I I apologize if I didn't
>> [clears throat]
>> if I didn't do a good enough job
>> No, you did a good job.
I have the the worst ADHD the doctors ever seen, they said.
>> So, you have to remember and this is one of the the things that I tried to really give some context for in the talk, but it's hard it's hard to wrap your head around is I guess the way I would say it.
Nowadays, we just assume like everybody just assumes that we have this concept that we can take a set of data like you know, int x, int y, char star foo or something, right?
And put them together in a struct or a class or whatever you want to think of.
And then that will be like in memory, it will just be stored that way and it's very fast for us to access, right?
So, one way to draw a differentiation here would be to think about, you know how JavaScript is kind of like well, it's this big hash table.
It's like if I want to make an object just a big bag and I put things in it and then if I want to get them out, it's going to be like a lookup on like this name, whatever it is, right?
And then like maybe the jit, if it can figure it out, can make it into something that's like a fixed thing in memory, but not necessarily, right?
Whereas in C or in Rust or probably in Go, I'm assuming as well like there's you know, languages that are kind of made more for compile time I can say this is the data layout and then just have like a pointer or a handle or a reference or whatever it gets called in that language is like the location in memory where this thing is and if I want the int x, I can just get it.
If I want the int y, I can just get it just with a simple numerical offset.
So, it's super efficient to talk about this like bundle of data.
So, what you have to remember and it's really hard to wrap your head around like I said is if you rewind time to 1950, no one had thought of that.
That's just not on the table, right?
No one had thought that what you want when you're writing like in a a higher level language, which they hadn't really even conceived of at that time very much, right?
When you're programming a computer, they're like, "Oh, wait.
We could just store like one address in the computer's memory and we could know how to get to lots of different related pieces of data all bundled together just by using a fixed numerical offset that we know is the same no matter which one of these we're using, right?
So, you could kind of think of this as like the most the earliest form of the idea of instantiation.
Like I have a definition of a thing, a type and I'm going to actually have now one of those and I could make another one if I wanted at a different place in memory, right?
And so just to underscore because again, it's really hard to wrap your head around this cuz we just it's just assumed now.
Like we don't even think about this at all anymore.
It's just like of course you could do that if you wanted to or whatever, right?
Just to underscore how much they didn't know this yet.
Um when so Doug T. Ross is this guy who comes up with the concept of a Plex.
He's on this team at MIT at this laboratory for it's called the Servomechanisms Laboratory at the time.
Later gets renamed to a different name whose name escapes me, but it's um it's a originally called the Servomechanisms Library.
Laboratory.
And what they do is they make like robotic tooling for making like you know, we would think of it today as 3D printing almost is what they were working on way back in the '50s.
Making this stuff for the Air Force and whatever.
So, it's like Z O D stuff, right?
So, anyway, the idea here is back then you had like in memory, you had arrays and stuff.
So, you know, they would think of it as like, "Oh, I have an array of integers."
They had that concept.
So, I'm going to think of it as like I've got a base pointer to an array and I'm going to get the third element out of that array to get one of the integers.
That's the thing everyone's thinking about.
Doug Ross publishes a paper literally publishes a paper.
This is how much people weren't thinking about this.
Saying, "Hey, I got this idea.
What if we flipped the arguments to the hardware array indexer?
So, that instead of thinking of jumping a fixed size n like you know, we're going to go through elements of an array off of a base pointer, what if we flipped it and said instead what we have is a base pointer and then a flexible offset.
So, the array is of these larger chunks and then we just sub go arbitrary offset inside the sub chunks.
We're flip it.
Instead, it will flip the fixed offset and the flexible offset part of that.
He called it reverse indexing.
And then he's like, "If we do that, then we can have this thing called a Plex, which is a bunch of related data that's all smooshed together and we can have lots of those and that way we can just go, 'Oh, let's look at the x-coordinate of this thing and the y-coordinate of this thing and the name of this thing' and they'll all be together, right?"
And that's what he called the Plex for um it's short for plexus, which I guess I don't speak Latin.
But I guess you know, if you're a doctor or a lawyer and you do, that I guess means like an interconnected like a node where things are connected.
Like a that kind of I don't know.
It's like solar plexus might be a use of that term, right?
Like a thing where a bunch of things comes together.
A node where things can come together.
And he calls it that because not only did he conceptualize this idea of packing all the things together as the way a program might be operating but he also figured out that you could add you could augment that thing with stuff like relational links to other things.
So, the idea of a pointer from one Plex to another to say like, "This is the point that I am you know, I'm a line and I have two end points and here's pointers to each of those points, right?"
And those are Plexes themselves.
And so it's so he was imagining this big web of these things, which is exactly how we compute today.
Like it is literally how we program today and he figured this out in 1956.
Okay, so I forgot I understand this, okay?
So, like for the other people in the chat who are a little slower like myself.
So, like back in the day if I want to go to a friend's house, I wrote their address down.
So, I got an address, get to a friend's house.
I got another friend, I write their address down again.
I go to their house.
However, I want to get to the McDonald's.
I don't want to write down how to get to the McDonald's from the friend's house.
I know it's two blocks up.
I know there's an Arby's two blocks that way and there's a Wendy's two blocks that way.
So, I just store the one address and I know get to a friend's house and then I've got Arby's here.
I've got my McDonald's over there.
I got my blank Wendy's over there and I'm storing less data.
Two blocks up is a lot better than like a full a full address to get somewhere.
Right chat, chat, this makes perfect sense, right?
Well, I this is a bit of a tortured metaphor, but I'll try to run with it.
It's you don't even have to store anything because the point is that it's as if all of your friends' houses all had an Arby's two blocks up.
So, you just know when you go to any friend's house, you go up two blocks.
You don't have to store that information cuz it's a given and that's the magic of a Plex or a struct as we now call it typically in like C parlance, we would call it a struct.
It's basically saying, "Look, if I just know the block layout and that's compiled directly into the program then I no longer have to do all this work to gather the data.
It's all right there and furthermore, I can easily reference one of the other.
Like I can just like you said, I can just say the address of a friend's house and now you also know the address of the Arby's, right?
And again, in this weird world we're living in, all friends' houses have Arby's two blocks up for them, which I don't know if that's good.
Like I don't know if all your friends I don't know if there's that many Arby's that should be in the world, but let's say that there is or everyone likes roast beef a lot and so that's what's happening, then yeah.
Um for those that don't know, I believe this is during the '40s.
Computers didn't even have the concept of an indirect address for quite some times or an indirect reads being able to use a memory spot as a as a means to read into something else.
And so this was already like we're not even that far from a world of where they're just like, "Wait a second.
We could read from one location into another location.
We could just store something that could read somewhere else all the time."
So, like this is only on the heels of that.
So, it's actually
>> he he actually was sort of saying, "Look, what you could do is use this instruction that these machines have for array indexing and flip the parameters and it will do this kind of Plex."
So, he's he's literally having to like back fit this idea onto the hardware cuz the hardware wasn't really designed to do this, right?
So, that's how that's how not like thinking in this direction it was at the time.
Yeah.
Well, it's also just it was so new still, right?
Like this whole you know, it's just people didn't even have this concept of a like I think it's so easy to take for granted how much we have kind of pre-built into our head on this.
Yeah, and so what people were you know, so other competing at there were other ideas at the time too.
So, Lisp is contemporaneous with this.
They're actually both kind of doing this work in like the mid-1950s, 1956, 7, 8.
Um Lisp was taking like a different approach.
They still want to do stuff like bags of data where we kind of know like, "Oh, the first one is this the second one is this the third one is this.
But in Lisp since everything is treated as like these sort of like uniform elements that kind of get concatenated together, you had to do stuff like okay, I know I need to hop three elements down in my list, right?
To get to this particular uh uh element of it, right?
Which is way less efficient with the way that Lisp is constructed.
And so actually one of the things that Doug Ross does in his first paper he publishes cuz he has the idea in 1956.
He publishes a paper on it 1960 which by the way is the same year that like Lisp published their paper.
So it's like right there those are both the same time.
McCarthy publishes the like the the primary paper on Lisp in 1960 as well.
Um and uh he actually kind of he he disses Lisp a little bit, right?
In the paper he's like yeah, you know these guys were kind of this cuz remember McCarthy's at MIT.
Ross is at MIT.
Everyone's at MIT.
They all know what's up, right?
Uh he basically says like yeah, Lisp I it's inefficient.
Because I want to get that third element, I got to go through each thing and also when you're storing it it's inefficient because you have to store the linkages between these things and to treat them as these uniform manipulable lists.
It's like I don't need to do that when I know my layout when I'm once I've decided on the layout for this thing, I can just fix it in place.
And this turns out to be incredibly powerful concept.
So powerful it's the building block of like every program I wrote right today.
And a lot of people that's true, too.
Obviously some languages not so much like I said JavaScript is more of a language that's more Lisp like.
It's saying like well, an object is kind of just a handle and then there's this big hash table and I can just throw anything in that I want.
That has a like nice flexibility to it, but it has costs, right?
It has efficiency costs to it.
And so what Doug Ross is really doing with this plex is coming up with this idea of the more efficient version for when you don't need that flexibility.
Okay.
We have actually a pretty interesting question from the chat which is did they have creatine back then?
>> [snorts]
>> They did.
I'm sure because I feel like Doug Ross must have been drinking it.
Because I don't know how he came up with so much stuff.
We're not even done yet with plexes including in the first paper.
Any more creatine?
The very first paper on plexes he also nailed discriminated unions.
So the idea that you could have a type field in there that would basically change how this thing was processed or what some of the data was used for and virtual functions basically.
The idea of a function pointer was in the original plex paper.
He's like look inside this plex we could also just put a jump like an address in the plex so that when the thing comes to process it it can read that address and jump to a subroutine that will process this plex efficiently specifically and do things specific only to this plex, right?
So he crushes it all.
He's just like welcome to the future.
Here's my 1960s paper that tells you all of the tools that everyone will use in the year 2025 pretty much down to a like down to the layout in memory.
And then like for some reason he doesn't just mic drop and walk off stage.
I would have.
I would have been like all right y'all, I'm done.
You're welcome for the future.
I'm Doug T. Ross.
Thank you.
Good night Cleveland or whatever, right?
Like that kind of thing.
>> literally foresaw all of modern computing.
Like whether intentional or by accident, he's foresaw everything and that's cuz you pretty much described everything we use today.
Correct.
Like he got all the building blocks.
And the thing that really so oh and by the way he also nailed the free store.
He had this thing called beads where it was like oh if we take these plexes and we sort them by like their size we can have free lists that just are batches of these so that we won't fragment memory.
And then he comes up with the arena.
He's like we can also just batch free the entire group of the plexes, right?
That's crazy.
No, the dude is like next level.
And here's the thing that sucks because people don't freaking read they write histories of these things and completely miss this because they don't bother to read.
They just go to Wikipedia and then they type that out in their book and you get a completely bogus history that leaves these people out.
But he's the guy who actually figured this crap out.
And it's awesome.
So like I'm on team I want I want to like get Doug T. Ross back into the Wikipedia pages people cuz this dude he actually figured it out.
He kind of went a little crazy later.
A lot of them go crazy.
As as it tends to happen when you invent a lot of brand new things.
>> [laughter]
>> But you know Rock stars die young.
Great programmers die crazy.
That's right, baby.
>> I mean I I don't know what happened later in life.
I don't know what direction he took, but in the 60s he invented the discriminated union.
I don't support that.
I that that that sounds like something you'd invent in the 60s.
[laughter]
Like not for me.
Uh I'm sorry, I couldn't help myself.
Uh also I love you can't you have to say the T every time, okay?
Doug T. Ross.
Doug T. Ross.
Ross.
If you have a middle name a middle letter like that that means like more power.
>> L. Jackson.
>> Exactly.
It's not just Samuel Jackson.
They're like the middle letter is important.
So if all these things have come true I now need to find out what has not come true.
And I got to get on Polymarket and make a bet that it's going to come true.
Like what was he wrong about then?
He did he did not have a 100% success rate.
If he's the Nostradamus of tech that means he's probably 99% wrong.
>> He's from the future if he got everything right.
That's a good question.
Um I mean maybe if you looked at some like afterwards he started to think that plexes and I kind of understand why.
But like he started to think of plexes as like the nature of the universe.
Do you see where I'm going with this?
Like he was like oh the entire world is plexes.
Oh yeah.
It's like all he sees is just plexes.
Everything's a plex.
Yeah.
So like it kind of like it kind of went that way.
So I I and I don't know that it is.
I mean I don't I'm just not for me to say.
I I don't have Doug T. Ross levels of of future.
>> enough to see it see the world like that.
>> He's kind of on a different level.
So I don't want to say that they're not but it certainly hasn't quite turned out that way yet anyway.
>> So he also invented simulation theory.
Kind of.
He was definitely on team simulation theory.
Although I don't really invented there's probably other people who were pushing that pretty early, right?
Well what's his name?
Bostrom what's his name?
out there mad somewhere.
It says on his Wikipedia article he made me.
He's like what?
Doug T. Ross.
No.
Yeah.
No I'm looking forward to the diss tracks between Doug T. Ross creatine Remember if you if you the first human to like actually officially uh create or you know discover simulation theory you know discover not create like that's going to be the AI's one of their best friends.
Obviously.
You're going to become Oh yeah.
the first one to discover it so it's a big deal cuz you're going to get plucked out when they say hey we're going to do a wipe new experiment.
They go oh good job you figured it out.
You get pulled just one.
Yeah.
That's a good point.
That's a good point.
Doug T. Ross has maybe figured maybe he figured all that out and he's just angling to be scooped.
Exactly.
He wants to be scooped.
Uh I I will say I did lose a friend to group theory very similarly to this problem where they got so deep into group theory.
Did you just say I lost a friend to group theory?
>> lost him.
This is what it was like.
Listen.
It was like Haskell Haskell.
No, not just Haskell.
Group theory.
Hey I got to go study uh uh math in Poland.
And then it when you hang out it's like dude we're a discriminated union and this drink is a tag to you and you're like dude what is going on?
And he stops talking about programming anymore and he only was talking about like don't you see it's all groups, man and like you're at Chipotle and it's just like don't you see this I'm like I don't care.
And it's like I lost Think about the ontology of this burrito.
Yes, he he last I heard he moved to Russia to do math.
And that's never good when you're going to Russia for math.
All right.
That is extra level mathing though.
Like that is It is.
I mean that's where uh yeah.
Hey, do you want to learn how to code?
Do you want to become a better back end engineer?
Well you got to check out boot.dev.
Now I personally have made a couple courses from them.
I have live walk throughs free available on YouTube of the whole course.
Everything on boot.dev you can go through for free.
But if you want the gamified experience the tracking of your learning and all that then you got to pay up the money.
But hey go check them out.
It's awesome.
Many content creators you know and you like make courses there.
boot.dev/prime for 25% off.
