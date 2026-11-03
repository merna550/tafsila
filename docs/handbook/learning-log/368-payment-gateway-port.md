---
date: "2026-11-02"
issue: "#368"
title: "Payment gateway behind a port, with a fake that signs"
---

Payments sit behind a `PaymentGateway` port with a Paymob adapter and a fake one; the fake signs and verifies callbacks with the same HMAC-SHA512 code, so CI exercises the real check without a Paymob account, and card data is dropped when a callback is parsed

Read: [Paymob and Fawry](../tech/paymob-fawry.md)
