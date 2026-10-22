(define-constant treasury tx-sender)
(define-data-var total-donated uint u0)
(define-data-var donation-count uint u0)
(define-map donor-totals principal uint)

(define-read-only (get-treasury)
  (ok treasury))

(define-read-only (get-total-donated)
  (ok (var-get total-donated)))

(define-read-only (get-donation-count)
  (ok (var-get donation-count)))

(define-read-only (get-donor-total (donor principal))
  (ok (default-to u0 (map-get? donor-totals donor))))

(define-public (donate (amount uint))
  (begin
    (asserts! (> amount u0) (err u1))
    (try! (stx-transfer? amount tx-sender treasury))
    (var-set total-donated (+ (var-get total-donated) amount))
    (var-set donation-count (+ (var-get donation-count) u1))
    (map-set donor-totals tx-sender
      (+ (default-to u0 (map-get? donor-totals tx-sender)) amount))
    (ok amount)))
