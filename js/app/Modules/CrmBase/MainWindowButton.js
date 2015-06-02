Ext.define('Optima5.Modules.CrmBase.MainWindowButton',{
	extend:'Ext.button.Button',
	alias: 'widget.op5crmbasemwbutton',
	
	childEls: [
		'btnEl', 'btnWrap', 'btnInnerEl', 'btnIconEl', 'btnInnerTextTitle', 'btnInnerTextRedcount', 'btnInnerTextCaption'
	],
	renderTpl:
		'<span id="{id}-btnWrap" data-ref="btnWrap" role="presentation" unselectable="on" style="{btnWrapStyle}" ' +
					'class="{btnWrapCls} {btnWrapCls}-{ui} {splitCls}{childElCls}">' +
			'<span id="{id}-btnEl" data-ref="btnEl" role="presentation" unselectable="on" style="{btnElStyle}" ' +
						'class="{btnCls} {btnCls}-{ui} {textCls} {noTextCls} {hasIconCls} ' +
						'{iconAlignCls} {textAlignCls} {btnElAutoHeightCls}{childElCls}">' +
					'<tpl if="iconBeforeText">{[values.$comp.renderIcon(values)]}</tpl>' +
					'<span id="{id}-btnInnerEl" data-ref="btnInnerEl" unselectable="on" ' +
						'class="{innerCls} {innerCls}-{ui}{childElCls}">' +
							'<span id="{id}-btnInnerTextTitle" data-ref="btnInnerTextTitle" class="op5-crmmbase-mainwindowbtn-title">{textTitle}</span>' +
							'&nbsp;&nbsp;' +
							'<span id="{id}-btnInnerTextRedcount" data-ref="btnInnerTextRedcount" class="op5-crmmbase-mainwindowbtn-redcount">({textRedcount})</span>' +
							'<br/>' +
							'<span id="{id}-btnInnerTextCaption" data-ref="btnInnerTextCaption" class="op5-crmmbase-mainwindowbtn-caption">{textCaption}</span>' +
						'</span>' +
					'<tpl if="!iconBeforeText">{[values.$comp.renderIcon(values)]}</tpl>' +
			'</span>' +
		'</span>' +
		'{[values.$comp.getAfterMarkup ? values.$comp.getAfterMarkup(values) : ""]}' +
		// if "closable" (tab) add a close element icon
		'<tpl if="closable">' +
			'<span id="{id}-closeEl" data-ref="closeEl" class="{baseCls}-close-btn">' +
					'<tpl if="closeText">' +
						' {closeText}' +
					'</tpl>' +
			'</span>' +
		'</tpl>',
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			//height:32,
			scale:'large',
			text:me.getText()
		});
		
		me.callParent() ;
	},
	afterRender: function() {
		var me = this;
		me.setComponentVisibility();
	},
	getTemplateArgs: function() {
		var me = this ;
		return Ext.apply(me.callParent(),{
			textTitle: me.textTitle || '&#160;',
			textRedcount: me.textRedcount || '',
			textCaption: me.textCaption || '&#160;'
		});
	},
	getText: function() {
		var me = this ;
		return me.textTitle + ' ' + me.textRedcount + '<br>' + me.textCaption ;
	},
	setObjText: function( obj ) {
		var me = this ;
		me.textTitle = obj.title;
		me.textRedcount = obj.redcount;
		me.textCaption = obj.caption;
		if (me.el) {
			me.btnInnerTextTitle.update(me.textTitle || '&#160;');
			me.btnInnerTextRedcount.update('(' + (me.textRedcount || '&#160;') + ')');
			me.btnInnerTextCaption.update(me.textCaption || '&#160;');
			me.setComponentVisibility();
		}
		me.doComponentLayout() ;
	},
	getObjText: function() {
		var me = this ;
		return {
			title: me.textTitle,
			redcount: me.textRedcount,
			caption: me.textCaption
		} ;
	},
	setComponentVisibility: function() {
		var me = this ;
		if( me.textRedcount && me.textRedcount != '' ) {
			me.btnInnerTextRedcount.show() ;
		} else {
			me.btnInnerTextRedcount.hide() ;
		}
	}
});