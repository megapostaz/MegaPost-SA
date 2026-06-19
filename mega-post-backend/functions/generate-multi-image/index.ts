import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import puppeteer from "npm:puppeteer-core";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    let browser;

    try {
        const { asins } = await req.json();
        const deviceId = req.headers.get('x-device-id');

        if (!asins || asins.length === 0) throw new Error("No ASINs provided");

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const { data: user } = await supabase
            .from('user_settings')
            .select('browserless_key')
            .eq('device_id', deviceId)
            .single();

        const browserlessKey = user?.browserless_key || "";

        const query = asins.join("|");
        const url = `https://www.amazon.sa/s?k=${encodeURIComponent(query)}`;

        const endpoint = `wss://chrome.browserless.io?token=${browserlessKey}&stealth`;

        browser = await puppeteer.connect({
            browserWSEndpoint: endpoint,
            defaultViewport: { width: 1920, height: 1080 }
        });

        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121 Safari/537.36"
        );

        // ✅ Saudi Amazon Cookies

        // الكوكيز الثابتة
        await page.setCookie(
            {
                name: "at-acbsa",
                value: "Atza|gQCY1oyvAwEBAhmkGLL0A5aWVR6hAiF8WjIAenv1m2ZECQ61-W8LMamOJRmUoCCEOwW72P1LxF6BGCJryt4h34PeiB9bpnPRKmlNCl3JtP4i8I4dkn2X1-3TEna2YTKNwzqDHmrHc9ElG3yCnD_2GLE8h0OWL9MxF4hPPIupMQqG-RQh3TP1qq9JzNfjg5pm29J-_xu_JGiq-aatOoVZgvv5paLH3aFENDW4OaHZhXtir0oKSFxotx7b4XVgJZBxeUGxEgQO9zR_De3jegveR74RQNhw2miHsGPssj3w0LsRmouKQRn6JUBBLQCzRYu8697YMBQPKPDLS57SJ1zFvIyahy3_o2Eya8y2jD9AzTUn23s",
                domain: ".amazon.sa",
                path: "/",
                httpOnly: true,
                secure: true,
            },
            {
                name: "sess-at-acbsa",
                value: "HldfCJ5ftjccNAlVfcauRPohpvo53fu+an0YvkYAZy0=",
                domain: ".amazon.sa",
                path: "/",
                httpOnly: true,
                secure: true,
            },
            {
                name: "session-id",
                value: "262-9116909-1058859",
                domain: ".amazon.sa",
                path: "/",
                secure: true,
            },
            {
                name: "session-id-time",
                value: "2082787201l",
                domain: ".amazon.sa",
                path: "/",
                secure: true,
            },
            {
                name: "session-token",
                value: "kc4+QHu9cfWsyfm2Q523JPP0/uNwj+O1RHZ2FUyzhANtpmsBWDlQhG100KeX/T7JmvjV5II0p6/NhrimOpwyhcZ70E+xtiuCx1IjZFlDMFYG9PxIBTZ4KU4AbQaXpkssdlGKqaKPn8/oBIIQ556WJxfZdZ56+jYdgfD6XMqD6uInWMyK/tSZ3O28bUFk8cfxeOU2R5UuaGbsHgU/ZoSK760SGBUyjkTH",
                domain: ".amazon.sa",
                path: "/",
                secure: true,
            },
            {
                name: "ubid-acbsa",
                value: "262-2244856-7554403",
                domain: ".amazon.sa",
                path: "/",
                secure: true,
            },
            {
                name: "i18n-prefs",
                value: "SAR",
                domain: ".amazon.sa",
                path: "/",
            },
            {
                name: "lc-acbsa",
                value: "ar_AE",
                domain: ".amazon.sa",
                path: "/",
                secure: true,
            }
        );
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'ar-SA,ar;q=0.9'
        });

        await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 60000
        });

        await new Promise(r => setTimeout(r, 3000));

        console.log("✅ Page Loaded");

        // 🔥 الطريقة الجديدة (canvas + ترتيب صح)
        await page.evaluate((orderedAsins) => {

            document.documentElement.dir = "rtl";
            document.body.style.direction = "rtl";
            document.body.style.fontFamily = "Tahoma, Arial";

            const canvas = document.createElement("div");
            canvas.id = "custom-screenshot-canvas";

            canvas.style.background = "#fff";
            canvas.style.display = "flex";
            canvas.style.flexWrap = "wrap";
            canvas.style.flexDirection = "row-reverse";
            canvas.style.gap = "20px";
            canvas.style.padding = "20px";
            canvas.style.width = "max-content";
            canvas.style.maxWidth = "1920px";
            canvas.style.position = "absolute";
            canvas.style.top = "0";
            canvas.style.left = "0";
            canvas.style.zIndex = "9999999";

            const cards = document.querySelectorAll('div[data-component-type="s-search-result"]');

            const map: Record<string, HTMLElement> = {};

            cards.forEach(card => {
                const asin = card.getAttribute("data-asin");
                const isSponsored = card.querySelector(".puis-sponsored-label-text");

                if (asin && !isSponsored && card instanceof HTMLElement && card.offsetWidth > 200) {
                    map[asin] = card;
                }
            });

            // 🔥 الترتيب الصح 100%
            const orderedElements = orderedAsins
                .map(a => map[a])
                .filter(Boolean);

            orderedElements.reverse().forEach((el) => {

                const unwanted = el.querySelectorAll(
                    'span[data-component-type="s-status-badge-component"], div[data-cy="secondary-offer-recipe"]'
                );
                unwanted.forEach(e => e.remove());

                el.style.width = el.offsetWidth + "px";
                el.style.minWidth = el.offsetWidth + "px";
                el.style.margin = "0";

                canvas.appendChild(el);
            });

            const root = document.querySelector("#a-page");
            if (root) root.style.display = "none";

            document.body.appendChild(canvas);

        }, asins);

        await new Promise(r => setTimeout(r, 1500));

        const element = await page.$("#custom-screenshot-canvas");

        if (!element) throw new Error("Canvas not created");

        const buffer = await element.screenshot({
            type: "jpeg",
            quality: 100
        });

        const fileName = `multi_canvas_${Date.now()}.jpg`;

        const { error: uploadError } = await supabase
            .storage
            .from('banners')
            .upload(fileName, buffer, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase
            .storage
            .from('banners')
            .getPublicUrl(fileName);

        return new Response(JSON.stringify({ image_url: publicUrl }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 400,
            headers: corsHeaders
        });
    } finally {
        if (browser) await browser.close();
    }
});