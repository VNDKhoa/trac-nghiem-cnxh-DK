# Trắc nghiệm Chủ nghĩa xã hội

Web dùng HTML, CSS và JavaScript thuần. Mở trực tiếp `index.html` bằng trình duyệt; không cần máy chủ, internet hay thư viện ngoài. Ảnh câu hỏi nằm trong `Question/`.

## Dữ liệu hiện tại

- 261 câu từ 263 ảnh đã xử lý của Chương 6. `Cau_59_gui_lai.png` là bản gửi lại của câu 59; hai ảnh `11.31.07` và `11.31.11` trong bộ cuối trùng nội dung câu 61.
- Câu 1–65 được nhập từ bốn phần văn bản đầu; câu 66–115 từ 50 ảnh trong `Question/CL01.1-NB`; câu 116–195 từ 80 ảnh trong `Question/CL01.2-TH`; câu 196–261 từ 67 ảnh trong `Question/LO1.2-TH-final` (66 câu khác nhau). Xem `OCR_REPORT.md` để biết ảnh nào đã xử lý.
- **261 đáp án đã được xác nhận** và được dùng để chấm điểm. Nguồn ghi trong `answerSource`; ảnh câu 66–261 hiển thị đáp án đúng.
- Đã xác minh lại **196/196 đáp án** từ C6-066 đến C6-261 với ảnh nguồn; xem phần kết quả trong `OCR_REPORT.md`.
- Lựa chọn bị cắt trong ảnh ở C6-170 và C6-188 được đánh dấu `[CẦN KIỂM TRA]` trong dữ liệu văn bản.
- Câu 19, 29 và 52 đã được đối chiếu với ảnh kết quả bài kiểm tra do người dùng cung cấp; đáp án lần lượt là `d`, `c`, `a`.
- Toàn bộ ảnh hiện có trong `Question/` đã được ghi nhận; ảnh trùng không tạo thêm câu.
- Lời giải ChatGPT được giữ ở `suggestedExplanation` để quản lý; chưa được xác minh riêng nên không hiện như lời giải đã xác minh trong web.

## Mở web

Nhấp đúp `index.html`, hoặc kéo tệp vào Chrome/Edge/Firefox. Giữ nguyên cấu trúc thư mục và đặt `questions.js`, `app.js`, `style.css` cạnh `index.html`. Trình duyệt lưu tiến độ bằng `localStorage` theo từng bộ câu hỏi. Xóa dữ liệu trang trong trình duyệt cũng sẽ xóa tiến độ.

## Sửa và xác minh câu hỏi

`questions.js` là dữ liệu web dùng trực tiếp. Mỗi câu có `id` duy nhất, `sourceImage`, `chapter`, `topic`, `question`, `options`, `answerIds`, `explanation` và `answerSource`. `questions.md` là bản dễ đọc để rà soát; khi sửa nội dung, cập nhật cả hai tệp.

```js
{
  id: "C6-001",
  sourceImage: "Question/Cau_hoi_Chuong_6_Cau_01-65/Cau_01.png",
  chapter: "Chương 6",
  topic: "Khái niệm dân tộc",
  question: "Nội dung câu hỏi",
  options: [{id: "a", text: "..."}, {id: "b", text: "..."}],
  selectionType: "single", // dùng "multiple" nếu người học phải chọn nhiều ý
  answerIds: null,           // chỉ điền sau khi xác minh: ["a"] hoặc ["a", "b"]
  explanation: null,         // lời giải đã xác minh, nếu có
  answerSource: null,        // ghi nguồn xác minh cụ thể
  suggestedAnswerIds: ["a"],
  suggestedExplanation: "Gợi ý chưa xác minh"
}
```

Khi có đáp án chính thức hoặc tài liệu tin cậy, đối chiếu từng câu với ảnh, rồi chuyển ID vào `answerIds`, lời giải đã xác minh vào `explanation` và ghi nguồn trong `answerSource`. Nếu chữ không rõ, đặt `[CẦN KIỂM TRA]` đúng vị trí; không đoán. Câu có `answerIds: null` hiển thị “Chưa có đáp án xác minh”, không tính đúng/sai và không vào vòng câu sai.

## Thêm ảnh, câu và chương mới

1. Thêm ảnh vào folder chương tương ứng.
2. Thêm một object câu hỏi vào mảng `window.QUESTION_BANK` trong `questions.js`; giữ `id` duy nhất và `sourceImage` là đường dẫn tương đối từ `index.html`.
3. Một ảnh có nhiều câu thì tạo nhiều object dùng cùng `sourceImage`.
4. Điền `chapter`; web tự tạo bộ Tổng hợp và bộ theo chương, không cần chỉnh số câu trong giao diện. `topic` có thể giữ trong dữ liệu để quản lý nhưng không hiện thành bộ riêng.
5. Cập nhật `questions.md` và `OCR_REPORT.md` để bản văn và danh sách ảnh luôn khớp.

## Cách dùng

Chọn bộ, bấm **Trộn câu và đáp án** để trộn cả hai một lần; bấm tiếp sẽ trộn lại. Số câu hiển thị luôn theo vị trí 1, 2, 3… dù nội dung câu đã đảo. Nhãn A, B, C, D giữ nguyên vị trí, chỉ nội dung lựa chọn đổi chỗ; web vẫn chấm theo ID đáp án gốc. Thứ tự mới được lưu khi tải lại trang. Câu một đáp án được ghi nhận khi bấm lựa chọn; câu nhiều đáp án cần bấm **Kiểm tra đáp án**. Chọn đúng sẽ tự sang câu kế; chọn sai hiện đáp án đã xác minh và đợi bấm **Câu tiếp →**. **Làm lại câu sai** dùng các câu đã từng được chấm sai và có thể lặp nhiều vòng. **Làm lại từ đầu** chỉ xóa tiến độ của bộ đang chọn. Chế độ Học chỉ hiển thị đáp án và giải thích đã xác minh.

## Kiểm tra tự động (tùy chọn)

Nếu đã cài Node.js, chạy `node test_app.cjs` để kiểm tra chức năng làm bài. Người học vẫn mở trực tiếp `index.html` mà không cần Node.js.
