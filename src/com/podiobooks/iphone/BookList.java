package com.podiobooks.iphone;

import java.util.List;

import javax.xml.bind.annotation.XmlRootElement;

import lombok.Data;

@Data
@XmlRootElement(name="bookList")
public class BookList {
    private List<Book> books;
}
