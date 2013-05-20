Ext.define('Optima5.Modules.CrmBase.MainWindowButton',{
	extend:'Ext.button.Button',
	alias: 'widget.op5crmbasemwbutton',
	
	renderTpl:
		'<em id="{id}-btnWrap" class="{splitCls}">' +
			'<button id="{id}-btnEl" type="{type}" hidefocus="true" role="button" autocomplete="off">' +
				'<span id="{id}-btnInnerEl" class="{baseCls}-inner" style="{innerSpanStyle}">' +
					'<span id="{id}-btnInnerTextTitle" class="op5-crmmbase-mainwindowbtn-title">{textTitle}</span>' +
					'&nbsp;&nbsp;' +
					'<span id="{id}-btnInnerTextRedcount" class="op5-crmmbase-mainwindowbtn-redcount">({textRedcount})</span>' +
					'<br/>' +
					'<span id="{id}-btnInnerTextCaption" class="op5-crmmbase-mainwindowbtn-caption">{textCaption}</span>' +
				'</span>' +
				'<span id="{id}-btnIconEl" class="{baseCls}-icon {iconCls}">&#160;</span>' +
			'</button>' +
		'</em>' ,
	
	initComponent: function() {
		var me = this ;
		
		me.addChildEls('btnInnerTextTitle','btnInnerTextRedcount','btnInnerTextCaption') ;
		 
		Ext.apply(me,{
			//height:32,
			scale:'large',
			text:me.getText()
		});
		
		me.callParent() ;
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
			me.setButtonCls();
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
	setButtonCls: function() {
		var me = this ;
		me.callParent() ;
		if( me.textRedcount && me.textRedcount != '' ) {
			me.btnInnerTextRedcount.show() ;
		} else {
			me.btnInnerTextRedcount.hide() ;
		}
	}
});