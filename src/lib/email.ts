import { Resend } from "resend";
import { escapeHtml } from "@/lib/escape-html";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Email to ${to}: ${subject}`);
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "【MAKELE《メイクル》】 <info@makele.jp>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[RESEND ERROR]", error);
    }
  } catch (err) {
    console.error("[RESEND EXCEPTION]", err);
  }
}

export function bookingConfirmedEmail(userName: string, artistName: string, date: string, time: string) {
  const u = escapeHtml(userName);
  const a = escapeHtml(artistName);
  const d = escapeHtml(date);
  const t = escapeHtml(time);
  return {
    subject: "【MAKELE】ご予約が確定しました",
    html: `
      <h2>ご予約が確定しました</h2>
      <p>${u} 様</p>
      <p><strong>${a}</strong> とのご予約が確定いたしました。</p>
      <p><strong>日付：</strong>${d}<br/><strong>時間：</strong>${t}</p>
      <p>MAKELEをご利用いただきありがとうございます。</p>
    `,
  };
}

/** Same event, artist-facing copy (MVP: email both parties on booking events). */
export function bookingConfirmedEmailToArtist(customerName: string, date: string, time: string) {
  const c = escapeHtml(customerName);
  const d = escapeHtml(date);
  const t = escapeHtml(time);
  return {
    subject: "【MAKELE】予約が確定しました（お客様への確定）",
    html: `
      <h2>予約が確定しました</h2>
      <p><strong>${c}</strong> 様とのご予約を確定しました。</p>
      <p><strong>日付：</strong>${d}<br/><strong>時間：</strong>${t}</p>
      <p>ダッシュボードの予約管理から詳細をご確認ください。</p>
    `,
  };
}

type CancelledBy = "user" | "artist" | "admin";

export function bookingCancelledEmailForUser(params: {
  userName: string;
  artistName: string;
  date: string;
  time: string;
  cancelledBy: CancelledBy;
}) {
  const u = escapeHtml(params.userName);
  const a = escapeHtml(params.artistName);
  const d = escapeHtml(params.date);
  const t = escapeHtml(params.time);
  const reason =
    params.cancelledBy === "user"
      ? "ご自身の操作によりキャンセルされました。"
      : params.cancelledBy === "artist"
        ? "アーティストによりキャンセルされました。"
        : "運営によりキャンセルされました。";
  return {
    subject: "【MAKELE】ご予約がキャンセルされました",
    html: `
      <h2>ご予約がキャンセルされました</h2>
      <p>${u} 様</p>
      <p>${d} ${t} の <strong>${a}</strong> とのご予約がキャンセルされました。</p>
      <p>${reason}</p>
      <p>ご不明点がございましたら、お気軽にお問い合わせください。</p>
    `,
  };
}

export function bookingCancelledEmailForArtist(params: {
  customerName: string;
  date: string;
  time: string;
  cancelledBy: CancelledBy;
}) {
  const c = escapeHtml(params.customerName);
  const d = escapeHtml(params.date);
  const t = escapeHtml(params.time);
  const reason =
    params.cancelledBy === "user"
      ? "お客様によりキャンセルされました。"
      : params.cancelledBy === "artist"
        ? "ご自身の操作によりキャンセルされました。"
        : "運営によりキャンセルされました。";
  return {
    subject: "【MAKELE】予約がキャンセルされました",
    html: `
      <h2>予約がキャンセルされました</h2>
      <p><strong>${c}</strong> 様との ${d} ${t} の予約がキャンセルされました。</p>
      <p>${reason}</p>
      <p>ダッシュボードの予約管理からご確認ください。</p>
    `,
  };
}

export function bookingRequestReceivedEmail(userName: string, artistName: string, date: string, time: string) {
  const u = escapeHtml(userName);
  const a = escapeHtml(artistName);
  const d = escapeHtml(date);
  const t = escapeHtml(time);
  return {
    subject: "【MAKELE】予約リクエストを受け付けました",
    html: `
      <h2>予約リクエストを受け付けました</h2>
      <p>${u} 様</p>
      <p><strong>${a}</strong> への予約リクエストを受け付けました。</p>
      <p><strong>日付：</strong>${d}<br/><strong>時間：</strong>${t}</p>
      <p>アーティストが確認後、予約確定メールをお送りします。</p>
    `,
  };
}

export function newBookingNotificationEmail(artistName: string, date: string, time: string) {
  const a = escapeHtml(artistName);
  const d = escapeHtml(date);
  const t = escapeHtml(time);
  return {
    subject: "【MAKELE】新しい予約リクエストが届きました",
    html: `
      <h2>新しい予約リクエスト</h2>
      <p>${a} 様</p>
      <p>新しい予約リクエストが届きました。</p>
      <p><strong>日付：</strong>${d}<br/><strong>時間：</strong>${t}</p>
      <p>MAKELEの管理画面から予約の確認・承認を行ってください。</p>
    `,
  };
}

export function bookingCompletedEmail(userName: string, artistName: string, date: string, time: string) {
  const u = escapeHtml(userName);
  const a = escapeHtml(artistName);
  const d = escapeHtml(date);
  const t = escapeHtml(time);
  return {
    subject: "【MAKELE】施術が完了しました",
    html: `
      <h2>施術が完了しました</h2>
      <p>${u} 様</p>
      <p>${d} ${t} の <strong>${a}</strong> との施術が完了しました。</p>
      <p>ご利用いただきありがとうございました。</p>
      <p>またのご予約を心よりお待ちしております。</p>
    `,
  };
}

export function bookingCompletedEmailToArtist(customerName: string, date: string, time: string) {
  const c = escapeHtml(customerName);
  const d = escapeHtml(date);
  const t = escapeHtml(time);
  return {
    subject: "【MAKELE】施術完了の記録",
    html: `
      <h2>施術が完了として記録されました</h2>
      <p><strong>${c}</strong> 様との ${d} ${t} の施術を完了として記録しました。</p>
      <p>ダッシュボードの予約管理からご確認ください。</p>
    `,
  };
}

export function casePublishedEmail(artistName: string, caseTitle: string, caseUrl: string) {
  const a = escapeHtml(artistName);
  const t = escapeHtml(caseTitle);
  const href = escapeHtml(caseUrl);
  return {
    subject: "【MAKELE】症例が公開されました",
    html: `
      <h2>症例が公開されました</h2>
      <p>${a} 様</p>
      <p>症例「<strong>${t}</strong>」の掲載が承認され、サイト上に公開されました。</p>
      <p><a href="${href}">症例ページを見る</a></p>
      <p>MAKELEをご利用いただきありがとうございます。</p>
    `,
  };
}

export function emailVerificationEmail(userName: string, verificationUrl: string) {
  const u = escapeHtml(userName);
  const href = escapeHtml(verificationUrl);
  return {
    subject: "【MAKELE】メールアドレスの確認",
    html: `
      <h2>メールアドレスの確認</h2>
      <p>${u} 様</p>
      <p>MAKELEへのご登録ありがとうございます。</p>
      <p>以下のリンクをクリックして、メールアドレスの確認を完了してください。</p>
      <p><a href="${href}" style="display:inline-block;padding:12px 24px;background:#c2185b;color:#fff;text-decoration:none;border-radius:8px;">メールアドレスを確認する</a></p>
      <p>このリンクは24時間有効です。</p>
    `,
  };
}

export function passwordResetEmail(userName: string, resetUrl: string) {
  const u = escapeHtml(userName);
  const href = escapeHtml(resetUrl);
  return {
    subject: "【MAKELE】パスワード再設定のご案内",
    html: `
      <h2>パスワード再設定のご案内</h2>
      <p>${u} 様</p>
      <p>いつもMAKELEをご利用いただきありがとうございます。</p>
      <p>パスワードの再設定リクエストを受け付けました。</p>
      <p>以下のボタンをクリックして、新しいパスワードを設定してください。</p>
      <p><a href="${href}" style="display:inline-block;padding:12px 24px;background:#c2185b;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">パスワードを再設定する</a></p>
      <p>※このリンクは1時間有効です。</p>
      <p>※お心当たりがない場合は、このメールを破棄してください。</p>
    `,
  };
}

export function bookingReminderEmailForUser(userName: string, artistName: string, date: string, time: string) {
  const u = escapeHtml(userName);
  const a = escapeHtml(artistName);
  const d = escapeHtml(date);
  const t = escapeHtml(time);
  return {
    subject: "【MAKELE】明日のご予約のリマインド",
    html: `
      <h2>明日のご予約のリマインド</h2>
      <p>${u} 様</p>
      <p>いよいよ明日、<strong>${a}</strong> とのご予約日となります。</p>
      <p><strong>日付：</strong>${d}<br/><strong>時間：</strong>${t}</p>
      <p>お気をつけてお越しくださいませ。<br/>MAKELEをご利用いただきありがとうございます。</p>
    `,
  };
}

export function bookingReminderEmailForArtist(artistName: string, customerName: string, date: string, time: string) {
  const a = escapeHtml(artistName);
  const c = escapeHtml(customerName);
  const d = escapeHtml(date);
  const t = escapeHtml(time);
  return {
    subject: "【MAKELE】明日の施術予約のリマインド",
    html: `
      <h2>明日の施術予約のリマインド</h2>
      <p>${a} 様</p>
      <p>明日のご予約のリマインドです。</p>
      <p><strong>お客様：</strong>${c} 様<br/><strong>日付：</strong>${d}<br/><strong>時間：</strong>${t}</p>
      <p>準備等よろしくお願いいたします。</p>
    `,
  };
}

export function booking3DayReminderEmailForUser(userName: string, artistName: string, date: string, time: string) {
  const u = escapeHtml(userName);
  const a = escapeHtml(artistName);
  const d = escapeHtml(date);
  const t = escapeHtml(time);
  return {
    subject: "【MAKELE】ご予約3日前のリマインド",
    html: `
      <h2>ご予約3日前のリマインド</h2>
      <p>${u} 様</p>
      <p><strong>${a}</strong> とのご予約が3日後に迫っております。</p>
      <p><strong>日付：</strong>${d}<br/><strong>時間：</strong>${t}</p>
      <p>ご来店を心よりお待ちしております。<br/>MAKELEをご利用いただきありがとうございます。</p>
    `,
  };
}

export function booking3DayReminderEmailForArtist(artistName: string, customerName: string, date: string, time: string) {
  const a = escapeHtml(artistName);
  const c = escapeHtml(customerName);
  const d = escapeHtml(date);
  const t = escapeHtml(time);
  return {
    subject: "【MAKELE】施術予約3日前のリマインド",
    html: `
      <h2>施術予約3日前のリマインド</h2>
      <p>${a} 様</p>
      <p>3日後のご予約のリマインドです。</p>
      <p><strong>お客様：</strong>${c} 様<br/><strong>日付：</strong>${d}<br/><strong>時間：</strong>${t}</p>
      <p>準備等よろしくお願いいたします。</p>
    `,
  };
}

export function artistProvisionalRegistrationEmail(artistName: string, adminContactUrl: string) {
  const a = escapeHtml(artistName);
  const href = escapeHtml(adminContactUrl);
  return {
    subject: "【MAKELE】アーティスト仮登録のお知らせ",
    html: `
      <h2>アーティスト仮登録のお知らせ</h2>
      <p>${a} 様</p>
      <p>MAKELEへのアーティスト登録リクエストを受け付けました。</p>
      <p>現在、運営にてご提出いただいた書類の審査を行っております。<br/>審査完了まで今しばらくお待ちください（通常1〜3営業日）。</p>
      <p>審査が完了しましたら、改めてご案内メールをお送りいたします。</p>
      <p>ご不明点がございましたら、<a href="${href}">お問い合わせ</a>ください。</p>
    `,
  };
}

export function artistApprovalEmail(artistName: string, dashboardUrl: string) {
  const a = escapeHtml(artistName);
  const href = escapeHtml(dashboardUrl);
  return {
    subject: "【MAKELE】アーティスト登録完了のお知らせ",
    html: `
      <h2>アーティスト登録完了のお知らせ</h2>
      <p>${a} 様</p>
      <p>書類の確認が完了し、MAKELEへのアーティスト本登録が完了いたしました。</p>
      <p>以下のリンクよりダッシュボードへログインし、プロフィールの設定やスケジュールの登録を行ってください。</p>
      <p><a href="${href}" style="display:inline-block;padding:12px 24px;background:#c2185b;color:#fff;text-decoration:none;border-radius:8px;">ダッシュボードへログイン</a></p>
      <p>MAKELEをご利用いただきありがとうございます。</p>
    `,
  };
}

export function inquiryReceivedEmail(userName: string) {
  const u = escapeHtml(userName);
  return {
    subject: "【MAKELE】お問い合わせを受け付けました",
    html: `
      <h2>お問い合わせを受け付けました</h2>
      <p>${u} 様</p>
      <p>MAKELE運営事務局へのお問い合わせありがとうございます。</p>
      <p>内容を確認の上、担当者より順次ご返信させていただきます。<br/>※内容によってはご返信にお時間をいただく場合がございます。</p>
      <p>引き続き、MAKELEをよろしくお願いいたします。</p>
    `,
  };
}

export function adminInquiryNotificationEmail(userName: string, userEmail: string, subjectTitle: string, message: string) {
  const u = escapeHtml(userName);
  const e = escapeHtml(userEmail);
  const s = escapeHtml(subjectTitle);
  const m = escapeHtml(message).replace(/\n/g, '<br/>');
  return {
    subject: `【お問い合わせ】${s}`,
    html: `
      <h2>サイトからのお問い合わせ</h2>
      <p><strong>お名前：</strong> ${u} 様</p>
      <p><strong>メールアドレス：</strong> ${e}</p>
      <p><strong>件名：</strong> ${s}</p>
      <hr/>
      <p><strong>内容：</strong></p>
      <p>${m}</p>
      <hr/>
      <p>※このメールはシステムからの自動送信です。返信する場合は、上記のお客様メールアドレス宛に直接ご返信ください。</p>
    `,
  };
}
