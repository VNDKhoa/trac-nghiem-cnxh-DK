# Trắc nghiệm Chủ nghĩa xã hội

Web dùng HTML, CSS và JavaScript thuần. Mở trực tiếp `index.html` bằng trình duyệt; không cần máy chủ, internet hay thư viện ngoài. Ảnh câu hỏi nằm trong `Question/Cau_hoi_Chuong_6_Cau_01-65/`.

## Dữ liệu hiện tại

- 65 câu từ 66 ảnh Chương 6. `Cau_59_gui_lai.png` là bản gửi lại của câu 59.
- Nội dung câu hỏi và lựa chọn được nhập từ bốn phần văn bản do người dùng cung cấp. Xem `OCR_REPORT.md` để biết mức độ đối chiếu với ảnh.
- **63 đáp án đã được người dùng xác nhận** và được dùng để chấm điểm. Nguồn ghi trong `answerSource`; ảnh gốc không hiển thị đáp án.
- Câu 29 và 52 có gợi ý chọn `d` nhưng ảnh chỉ có ba lựa chọn. Hai câu này giữ `answerIds: null`, không chấm điểm và được đánh dấu cần kiểm tra.
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
