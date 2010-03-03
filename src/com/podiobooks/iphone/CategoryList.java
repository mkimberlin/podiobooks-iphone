package com.podiobooks.iphone;

import java.util.List;

import javax.xml.bind.annotation.XmlRootElement;

import lombok.Data;

@Data
@XmlRootElement(name="categoryList")
public class CategoryList {
    private List<String> categories;
    private String error;
}
