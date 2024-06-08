require('dotenv').config();

const { Client, WebhookClient, MessageEmbed } = require('discord.js-selfbot-v13');
const figlet = require('figlet');
const colors = require('colors');

const client = new Client();
const prefix = process.env.PREFIX;
const webhookUrl = process.env.WEBHOOK_URL;
const embedColor = process.env.EMBED_COLOR;
const triggerLimpar = process.env.TRIGGER_LIMPAR || 'limpar';
const triggerAllUnf = process.env.TRIGGER_ALLUNF || 'allunf';
const triggerLimparDM = process.env.TRIGGER_LIMPARDM || 'limpardm';
const triggerFecharAll = process.env.TRIGGER_FECHARALL || 'fecharall';
const triggerLimparFecharAmigosDMs = process.env.TRIGGER_LIMPAR_FECHAR_AMIGOS_DMS || 'clearall';

function centerText(text) {
    const terminalWidth = process.stdout.columns || 80;
    const padding = Math.max(0, Math.floor((terminalWidth - text.length) / 3));
    return ' '.repeat(padding) + text + ' '.repeat(padding);
}

client.on('ready', () => {
    const asciiArt = figlet.textSync('Kills', {   // aqui voce muda o 'Kills' se quiser.
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    }).red;

    const maxLength = Math.max(...asciiArt.split('\n').map(line => line.length));
    const centeredAsciiArt = asciiArt.split('\n').map(line => centerText(line.padEnd(maxLength))).join('\n');
    console.log(centeredAsciiArt);

    const texto = `Conectado em:`;
    const username = ` ${client.user.tag}`.red;
    const spaces = " ".repeat((process.stdout.columns - texto.length) / 3);
    console.log(spaces + texto + username + "\n");
});

async function apagarMensagens(channel) {
    let hasMoreMessages = true;
    let contador = 0;

    while (hasMoreMessages) {
        try {
            const messages = await channel.messages.fetch({ limit: 100 });
            const userMessages = messages.filter(m => m.author.id === client.user.id && !m.system);

            if (userMessages.size === 0) {
                hasMoreMessages = false;
                break;
            }

            for (const message of userMessages.values()) {
                await message.delete();
                contador++;
            }

        } catch (error) {
            console.error('Erro ao tentar deletar as mensagens:', error);
            hasMoreMessages = false;
        }
    }

    console.log(`Total de mensagens apagadas no canal ${contador}`.red);

    const description = `As mensagens foram totalmente limpas. **${contador} mensagens foram apagadas.**`;
    await sendEmbed(description);

    return contador;
}

async function sendEmbed(description) {
    const webhookClient = new WebhookClient({ url: webhookUrl });
    const embed = new MessageEmbed()
        .setColor(embedColor)
        .setTitle('Ação Realizada')
        .setAuthor({
            name: `${client.user.username} (@${client.user.username})`,
            iconURL: client.user.displayAvatarURL({ dynamic: true })
        })
        .setDescription(description)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
    await webhookClient.send({ embeds: [embed] });
    webhookClient.destroy();
}

async function sendConsoleEmbed(description) {
    console.log(description);
}

async function unfzzz() {
    try {
        const relationships = await client.api.users('@me').relationships.get();
        const friends = relationships.filter(r => r.type === 1);

        for (let friend of friends) {
            try {
                await client.api.users('@me').relationships(friend.id).delete();
                const logMessage = `Amigo removido: ${friend.user.username}#${friend.user.discriminator}`;
                console.log(logMessage.red);
                await sendConsoleEmbed(logMessage);
                await sendEmbed(logMessage);
            } catch (error) {
                const logError = `Erro ao remover amigo: ${friend.user.username}#${friend.user.discriminator} ${error}`;
                console.error(logError.red);
                await sendConsoleEmbed(logError);
                await sendEmbed(logError);
            }
        }
        const successMessage = 'Todos os amigos foram removidos.';
        console.log(successMessage.green);
        await sendConsoleEmbed(successMessage);
        await sendEmbed(successMessage);
    } catch (error) {
        const errorMessage = `Erro ao tentar remover os amigos: ${error}`;
        console.error(errorMessage.red);
        await sendConsoleEmbed(errorMessage);
        await sendEmbed(errorMessage);
    }
}

async function fecharTodasDMs() {
    try {
        const userDMs = client.channels.cache.filter(channel => channel.type === 'DM');

        for (const dmChannel of userDMs.values()) {
            await dmChannel.delete();
            const logMessage = `DM com **${dmChannel.recipient.globalName} (@${dmChannel.recipient.tag})** foi fechada.`;
            console.log(logMessage.green);
            await sendConsoleEmbed(logMessage);
            await sendEmbed(logMessage);
        }

        const successMessage = 'Todas as DMs foram fechadas.';
        console.log(successMessage.green);
        await sendConsoleEmbed(successMessage);
        await sendEmbed(successMessage);
    } catch (error) {
        const errorMessage = `Erro ao tentar fechar as DMs: ${error}`;
        console.error(errorMessage.red);
        await sendConsoleEmbed(errorMessage);
        await sendEmbed(errorMessage);
    }
}

async function limparFecharAmigosDMs() {
    try {
        const relationships = await client.api.users('@me').relationships.get();
        const friends = relationships.filter(r => r.type === 1);

        for (let friend of friends) {
            try {
                const user = await client.users.fetch(friend.id);
                const dmChannel = await user.createDM();
                const contador = await apagarMensagens(dmChannel);
                await dmChannel.delete();
                const logMessage = `DM com ${user.username}#${user.discriminator} foi limpa e fechada. Total de mensagens apagadas: ${contador}`;
                console.log(logMessage.green);
                await sendConsoleEmbed(logMessage);
                await sendEmbed(logMessage);
            } catch (error) {
                const logError = `Erro ao limpar e fechar DM com ${user.username}#${user.discriminator} ${error}`;
                console.error(logError.red);
                await sendConsoleEmbed(logError);
                await sendEmbed(logError);
            }
        }
        const successMessage = 'Todas as DMs com amigos foram limpas e fechadas.';
        console.log(successMessage.green);
        await sendConsoleEmbed(successMessage);
        await sendEmbed(successMessage);
    } catch (error) {
        const errorMessage = `Erro ao tentar limpar e fechar as DMs dos amigos: ${error}`;
        console.error(errorMessage.red);
        await sendConsoleEmbed(errorMessage);
        await sendEmbed(errorMessage);
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.id !== client.user.id) return;

    const content = message.content.toLowerCase();

    if (content.includes(triggerLimpar)) {
        await message.delete();
        try {
            if (message.channel.type === 'DM' || message.channel.type === 'GUILD_TEXT' || message.channel.type === 'GROUP_DM') {
                await apagarMensagens(message.channel);
            }
        } catch (error) {
            const errorMessage = `Erro ao tentar deletar as mensagens: ${error}`;
            console.error(errorMessage.red);
            await sendConsoleEmbed(errorMessage);
            await sendEmbed(errorMessage);
        }
    } else if (content.includes(triggerAllUnf)) {
        await message.delete();
        try {
            await unfzzz();
        } catch (error) {
            const errorMessage = `Erro ao tentar remover os amigos: ${error}`;
            console.error(errorMessage.red);
            await sendConsoleEmbed(errorMessage);
            await sendEmbed(errorMessage);
        }
    } else if (content.startsWith(triggerLimparDM)) {
        await message.delete();
        const targets = content.slice(triggerLimparDM.length).trim().split(' ');

        for (const target of targets) {
            const user = await client.users.fetch(target).catch(() => null);
            const channel = await client.channels.fetch(target).catch(() => null);

            if (user) {
                try {
                    const dmChannel = await user.createDM();
                    await apagarMensagens(dmChannel);
                } catch (error) {
                    const logError = `Erro ao tentar deletar as mensagens: ${error}`;
                    console.error(logError.red);
                    await sendConsoleEmbed(logError);
                    await sendEmbed(logError);
                }
            } else if (channel) {
                try {
                    await apagarMensagens(channel);
                } catch (error) {
                    const logError = `Erro ao tentar deletar as mensagens: ${error}`;
                    console.error(logError.red);
                    await sendConsoleEmbed(logError);
                    await sendEmbed(logError);
                }
            } else {
                const errorMessage = 'Usuário ou canal não encontrado.';
                console.error(errorMessage.red);
                await sendConsoleEmbed(errorMessage);
                await sendEmbed(errorMessage);
            }
        }
    } else if (content.includes(triggerFecharAll)) {
        await message.delete();
        try {
            await fecharTodasDMs();
        } catch (error) {
            const errorMessage = `Erro ao tentar fechar todas as DMs: ${error}`;
            console.error(errorMessage.red);
            await sendConsoleEmbed(errorMessage);
            await sendEmbed(errorMessage);
        }
    } else if (content.includes(triggerLimparFecharAmigosDMs)) {
        await message.delete();
        try {
            await limparFecharAmigosDMs();
        } catch (error) {
            const errorMessage = `Erro ao tentar limpar e fechar as DMs dos amigos: ${error}`;
            console.error(errorMessage.red);
            await sendConsoleEmbed(errorMessage);
            await sendEmbed(errorMessage);
        }
    }
});

if (!process.env.TOKEN) {
    console.error('A token não está configurada. Por favor, configure a token no arquivo .env.');
    process.exit(1);
} else {
    client.login(process.env.TOKEN)
        .catch(error => {
            console.error('Erro ao fazer login:', error.message.red);
            process.exit(1);
        });
}
