Ext.define('Optima5.Modules.CrmBase.MainWindowButton',{
	extend:'Ext.button.Button',
	alias: 'widget.op5paracrmmwbutton',
	
	renderTpl:
		'<em id="{id}-btnWrap" class="{splitCls}">' +
			'<button id="{id}-btnEl" type="{type}" hidefocus="true" role="button" autocomplete="off">' +
				'<span id="{id}-btnInnerEl" class="{baseCls}-inner" style="{innerSpanStyle}">' +
					'<span class="op5-crmmbase-mainwindowbtn-title">{textTitle}</span>' +
					'<span class="op5-crmmbase-mainwindowbtn-redcount">{textRedcount}</span>' +
					'<br/>' +
					'<span class="op5-crmmbase-mainwindowbtn-caption">{textCaption}</span>' +
				'</span>' +
				'<span id="{id}-btnIconEl" class="{baseCls}-icon {iconCls}">&#160;</span>' +
			'</button>' +
		'</em>' ,
	
	initComponent: function() {
		var me = this ;
		 
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
	setText: function( obj ) {
		var me = this ;
		me.textTitle = obj.title;
		me.textRedcount = obj.redcount;
		me.textCaption = obj.caption;
		me.callParent(me.getText()) ;
	},
	getText: function() {
		var me = this ;
		return me.textTitle + ' ' + me.textRedcount + '<br>' + me.textCaption ;
	}
});